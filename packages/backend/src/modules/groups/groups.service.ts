import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Client, Prisma } from '@prisma/client';
import { getLegacyUserExternalAccountEmails } from '../repository/user-search';
import { legacyUserInclude, toLegacyUser } from '../repository/user-compat';
import { toPublicLegacyUser } from '../users/user-visibility';
import { prisma } from '../prisma';
import {
  deleteGroupAndRevokeLostApplicationRoles,
  hasApplicationAccessForUser,
  removeUserGroupMembershipAndRevokeLostApplicationRoles,
  replaceApplicationAccessGroups,
} from './groups.access';
import * as dto from './groups.dto';

type TGroupWithClient = Prisma.RbacGroupGetPayload<{
  include: {
    client: {
      select: {
        client_id: true;
        name: true;
      };
    };
  };
}>;

type TGroupUserMember = Prisma.RbacGroupMemberGetPayload<{
  include: {
    member_user: {
      include: typeof legacyUserInclude;
    };
  };
}>;

type TSerializedGroupUser = {
  id: string;
  display_name: string;
  login?: string;
  email?: string;
  nickname?: string;
  family_name?: string;
  given_name?: string;
  org_id?: string | null;
  [key: string]: unknown;
};

const groupListUserMembershipValues = ['member', 'non_member'] as const;
type TGroupListUserMembership = (typeof groupListUserMembershipValues)[number];

function getLegacyUserDisplayName(user: NonNullable<ReturnType<typeof toLegacyUser>>) {
  const fullName = [user.given_name, user.family_name].filter(Boolean).join(' ').trim();
  return (
    fullName ||
    user.nickname ||
    user.login ||
    (user.email_verified ? user.email || '' : '') ||
    `User #${user.id}`
  );
}

@Injectable()
export class GroupsService {
  private async ensureOrganization(organizationId: string) {
    const organization = await prisma.client.findFirst({
      where: {
        client_id: organizationId,
        parent_id: null,
      },
      select: {
        client_id: true,
        folder_id: true,
        parent_id: true,
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  private async ensureApplication(organizationId: string, applicationId: string) {
    const application = await prisma.client.findFirst({
      where: {
        client_id: applicationId,
        parent_id: organizationId,
      },
      select: {
        client_id: true,
        parent_id: true,
        folder_id: true,
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    return application;
  }

  private async ensureGroup(organizationId: string, groupId: string) {
    const group = await prisma.rbacGroup.findFirst({
      where: {
        id: groupId,
        client_id: organizationId,
      },
      include: {
        client: {
          select: {
            client_id: true,
            name: true,
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return group;
  }

  private async assertUserCanJoinOrganizationGroup(organizationId: string, userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        externalAccounts: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.deleted) {
      throw new NotFoundException('User not found');
    }

    if (user.org_id === organizationId) {
      return user;
    }

    const organizationRole = await prisma.role.findFirst({
      where: {
        client_id: organizationId,
        user_id: userId,
      },
      select: {
        id: true,
      },
    });

    if (organizationRole) {
      return user;
    }

    const externalEmails = getLegacyUserExternalAccountEmails({
      ExternalAccount: user.externalAccounts,
    });
    if (!externalEmails.length) {
      throw new BadRequestException('User does not belong to this organization');
    }

    const invitation = await prisma.clientInvitation.findFirst({
      where: {
        client_id: organizationId,
        email: {
          in: externalEmails,
        },
      },
      select: {
        id: true,
      },
    });

    if (!invitation) {
      throw new BadRequestException('User does not belong to this organization');
    }

    return user;
  }

  private serializeGroup(group: TGroupWithClient, usersCount = 0) {
    const { folder_id: _folderId, ...groupWithoutFolder } = group;

    return {
      ...groupWithoutFolder,
      usersCount,
    };
  }

  private serializeGroupUser(member: TGroupUserMember): TSerializedGroupUser | null {
    const legacyUser = member.member_user ? toLegacyUser(member.member_user) : null;
    if (!legacyUser) {
      return null;
    }

    return {
      ...toPublicLegacyUser(legacyUser, {
        includeTopLevelKeys: ['org_id'],
      }),
      id: legacyUser.id,
      display_name: getLegacyUserDisplayName(legacyUser),
    };
  }

  private async loadGroupUserCounts(groupIds: string[]) {
    if (!groupIds.length) {
      return new Map<string, number>();
    }

    const counts = await prisma.rbacGroupMember.groupBy({
      by: ['parent_group_id'],
      where: {
        parent_group_id: {
          in: groupIds,
        },
        member_user_id: {
          not: null,
        },
      },
      _count: {
        _all: true,
      },
    });

    return new Map(counts.map((item) => [item.parent_group_id, item._count._all]));
  }

  private getValidatedGroupListUserMembershipFilter(filter?: Record<string, unknown>) {
    if (!filter) {
      return null;
    }

    const rawUserId = filter.user_id;
    const rawUserMembership = filter.user_membership;

    if (rawUserId !== undefined && typeof rawUserId !== 'string') {
      throw new BadRequestException('user_id filter must be a string');
    }

    if (rawUserMembership === undefined) {
      return null;
    }

    if (!groupListUserMembershipValues.includes(rawUserMembership as TGroupListUserMembership)) {
      throw new BadRequestException(
        'user_membership filter must be either "member" or "non_member"',
      );
    }

    const normalizedUserId = typeof rawUserId === 'string' ? rawUserId.trim() : '';

    if (!normalizedUserId) {
      throw new BadRequestException(
        'user_id filter is required when user_membership filter is provided',
      );
    }

    return {
      userId: normalizedUserId,
      membership: rawUserMembership as TGroupListUserMembership,
    };
  }

  async createGroup(organizationId: string, createDto: dto.CreateGroupDto) {
    const organization = await this.ensureOrganization(organizationId);
    if (!organization.folder_id) {
      throw new NotFoundException('Default folder not found for organization');
    }

    const group = await prisma.rbacGroup.create({
      data: {
        client_id: organizationId,
        name: createDto.name,
        description: createDto.description,
        folder_id: organization.folder_id,
      },
      include: {
        client: {
          select: {
            client_id: true,
            name: true,
          },
        },
      },
    });

    return this.serializeGroup(group);
  }

  async getGroups(organizationId: string, params: dto.ListGroupsDto) {
    await this.ensureOrganization(organizationId);

    const { filter, limit, offset, search, sortBy, sortDirection } = params;
    const sortableFields = ['id', 'client_id', 'name', 'description'];
    const orderField = sortBy && sortableFields.includes(sortBy) ? sortBy : 'name';
    const userMembershipFilter = this.getValidatedGroupListUserMembershipFilter(filter);
    const {
      user_id: _userId,
      user_membership: _userMembership,
      ...groupFilter
    } = (filter as Record<string, unknown>) || {};

    const where: Prisma.RbacGroupWhereInput = {
      ...(groupFilter as Prisma.RbacGroupWhereInput),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
      client_id: organizationId,
      ...(userMembershipFilter
        ? {
            members:
              userMembershipFilter.membership === 'non_member'
                ? {
                    none: {
                      member_user_id: userMembershipFilter.userId,
                    },
                  }
                : {
                    some: {
                      member_user_id: userMembershipFilter.userId,
                    },
                  },
          }
        : {}),
    };

    const orderBy = {
      [orderField]: (sortDirection || 'asc') as Prisma.SortOrder,
    } satisfies Prisma.RbacGroupOrderByWithRelationInput;

    const [groups, totalCount] = await Promise.all([
      prisma.rbacGroup.findMany({
        where,
        include: {
          client: {
            select: {
              client_id: true,
              name: true,
            },
          },
        },
        take: limit,
        skip: offset,
        orderBy,
      }),
      prisma.rbacGroup.count({ where }),
    ]);

    const counts = await this.loadGroupUserCounts(groups.map((group) => group.id));

    return {
      groups: groups.map((group) => this.serializeGroup(group, counts.get(group.id) ?? 0)),
      totalCount,
    };
  }

  async updateGroup(organizationId: string, groupId: string, updateDto: dto.UpdateGroupDto) {
    await this.ensureGroup(organizationId, groupId);

    const group = await prisma.rbacGroup.update({
      where: { id: groupId },
      data: {
        name: updateDto.name,
        description: updateDto.description,
      },
      include: {
        client: {
          select: {
            client_id: true,
            name: true,
          },
        },
      },
    });

    return this.serializeGroup(group);
  }

  async deleteGroup(organizationId: string, groupId: string) {
    await this.ensureGroup(organizationId, groupId);

    await prisma.$transaction(async (tx) => {
      await deleteGroupAndRevokeLostApplicationRoles(tx, {
        organizationId,
        groupId,
      });
    });

    return { message: 'Group deleted successfully' };
  }

  async getGroupUsers(organizationId: string, groupId: string, params: dto.ListGroupUsersDto) {
    await this.ensureGroup(organizationId, groupId);

    const { filter, limit, offset, search, sortBy, sortDirection } = params;
    const members = await prisma.rbacGroupMember.findMany({
      where: {
        ...(filter as Prisma.RbacGroupMemberWhereInput),
        parent_group_id: groupId,
        member_user_id: {
          not: null,
        },
      },
      include: {
        member_user: {
          include: legacyUserInclude,
        },
      },
    });

    const serializedUsers = members
      .map((member) => this.serializeGroupUser(member))
      .filter((user): user is TSerializedGroupUser => Boolean(user))
      .filter((user) => {
        if (!search) {
          return true;
        }

        const normalizedSearch = search.toLowerCase();
        const searchableValues = [
          user.id,
          user.login,
          user.email,
          user.nickname,
          user.family_name,
          user.given_name,
          user.display_name,
        ]
          .filter((value): value is string => typeof value === 'string' && value.length > 0)
          .map((value) => value.toLowerCase());

        return searchableValues.some((value) => value.includes(normalizedSearch));
      });

    const sortableFields = ['id', 'login', 'email', 'nickname', 'family_name', 'given_name'];
    const orderField = sortBy && sortableFields.includes(sortBy) ? sortBy : 'display_name';
    const sortedUsers = [...serializedUsers].sort((left, right) => {
      const leftValue =
        (left[orderField as keyof typeof left] as string | undefined) ?? left.display_name ?? '';
      const rightValue =
        (right[orderField as keyof typeof right] as string | undefined) ?? right.display_name ?? '';

      const result = leftValue.localeCompare(rightValue, undefined, { sensitivity: 'base' });
      return (sortDirection || 'asc') === 'desc' ? -result : result;
    });

    const totalCount = sortedUsers.length;
    return {
      users: sortedUsers.slice(offset || 0, (offset || 0) + (limit || totalCount)),
      totalCount,
    };
  }

  async addGroupUser(organizationId: string, groupId: string, userId: string) {
    await this.ensureGroup(organizationId, groupId);
    const user = await this.assertUserCanJoinOrganizationGroup(organizationId, userId);

    const existingMember = await prisma.rbacGroupMember.findFirst({
      where: {
        parent_group_id: groupId,
        member_user_id: userId,
      },
      select: {
        id: true,
      },
    });

    if (existingMember) {
      throw new BadRequestException('User is already a member of this group');
    }

    const member = await prisma.rbacGroupMember.create({
      data: {
        parent_group_id: groupId,
        member_user_id: user.id,
      },
      include: {
        member_user: {
          include: legacyUserInclude,
        },
      },
    });

    return this.serializeGroupUser(member);
  }

  async removeGroupUser(organizationId: string, groupId: string, userId: string) {
    await this.ensureGroup(organizationId, groupId);

    const member = await prisma.rbacGroupMember.findFirst({
      where: {
        parent_group_id: groupId,
        member_user_id: userId,
      },
      select: {
        id: true,
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found in this group');
    }

    await prisma.$transaction(async (tx) => {
      await removeUserGroupMembershipAndRevokeLostApplicationRoles(tx, {
        organizationId,
        groupId,
        membershipId: member.id,
        userId,
      });
    });

    return { message: 'Member removed successfully' };
  }

  async getApplicationAccessGroups(
    organizationId: string,
    applicationId: string,
    params: dto.ListApplicationAccessGroupsDto,
  ) {
    await this.ensureOrganization(organizationId);
    await this.ensureApplication(organizationId, applicationId);

    const { filter, limit, offset, search, sortBy, sortDirection } = params;
    const sortableFields = ['id', 'client_id', 'name', 'description'];
    const orderField = sortBy && sortableFields.includes(sortBy) ? sortBy : 'name';
    const applicationAccessMembership =
      filter?.application_access_membership === 'non_member' ? 'non_member' : 'member';
    const { application_access_membership: _applicationAccessMembership, ...groupFilter } =
      (filter as Record<string, unknown>) || {};

    const where: Prisma.RbacGroupWhereInput = {
      ...(groupFilter as Prisma.RbacGroupWhereInput),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
      client_id: organizationId,
      applicationAccessGroups:
        applicationAccessMembership === 'non_member'
          ? {
              none: {
                application_id: applicationId,
                organization_id: organizationId,
              },
            }
          : {
              some: {
                application_id: applicationId,
                organization_id: organizationId,
              },
            },
    };

    const orderBy = {
      [orderField]: (sortDirection || 'asc') as Prisma.SortOrder,
    } satisfies Prisma.RbacGroupOrderByWithRelationInput;

    const [groups, totalCount] = await Promise.all([
      prisma.rbacGroup.findMany({
        where,
        include: {
          client: {
            select: {
              client_id: true,
              name: true,
            },
          },
        },
        take: limit,
        skip: offset,
        orderBy,
      }),
      prisma.rbacGroup.count({ where }),
    ]);

    const counts = await this.loadGroupUserCounts(groups.map((group) => group.id));

    return {
      groups: groups.map((group) => this.serializeGroup(group, counts.get(group.id) ?? 0)),
      totalCount,
    };
  }

  async addApplicationAccessGroup(
    organizationId: string,
    applicationId: string,
    groupId: string,
    actorUserId?: string | null,
  ) {
    await this.ensureGroup(organizationId, groupId);
    await this.ensureApplication(organizationId, applicationId);

    const existing = await prisma.applicationAccessGroup.findFirst({
      where: {
        organization_id: organizationId,
        application_id: applicationId,
        group_id: groupId,
      },
      select: {
        application_id: true,
        group_id: true,
      },
    });

    if (existing) {
      throw new BadRequestException('Application access group already exists');
    }

    const link = await prisma.applicationAccessGroup.create({
      data: {
        organization_id: organizationId,
        application_id: applicationId,
        group_id: groupId,
        created_by: actorUserId ?? null,
      },
      include: {
        group: {
          include: {
            client: {
              select: {
                client_id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    const counts = await this.loadGroupUserCounts([groupId]);
    return this.serializeGroup(link.group, counts.get(groupId) ?? 0);
  }

  async removeApplicationAccessGroup(
    organizationId: string,
    applicationId: string,
    groupId: string,
  ) {
    await this.ensureGroup(organizationId, groupId);
    await this.ensureApplication(organizationId, applicationId);

    const existing = await prisma.applicationAccessGroup.findFirst({
      where: {
        organization_id: organizationId,
        application_id: applicationId,
        group_id: groupId,
      },
      select: {
        application_id: true,
        group_id: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Application access group not found');
    }

    await prisma.applicationAccessGroup.delete({
      where: {
        organization_id_application_id_group_id: {
          organization_id: organizationId,
          application_id: applicationId,
          group_id: groupId,
        },
      },
    });

    return { message: 'Application access group removed successfully' };
  }

  async replaceApplicationAccessGroups(
    organizationId: string,
    applicationId: string,
    groupIds: string[],
    actorUserId?: string | null,
  ) {
    await this.ensureOrganization(organizationId);
    await this.ensureApplication(organizationId, applicationId);

    const uniqueGroupIds = Array.from(new Set(groupIds));
    if (uniqueGroupIds.length) {
      await Promise.all(uniqueGroupIds.map((groupId) => this.ensureGroup(organizationId, groupId)));
    }

    await replaceApplicationAccessGroups(
      prisma,
      organizationId,
      applicationId,
      uniqueGroupIds,
      actorUserId,
    );

    return {
      group_ids: uniqueGroupIds,
    };
  }

  async canAuthorizeWithAccessGroups(userId: string, client: Client) {
    if (!client.authorize_only_employees) {
      return true;
    }

    if (!client.parent_id) {
      return false;
    }

    const authorizationGroupAccess = await hasApplicationAccessForUser(
      prisma,
      client.parent_id,
      client.client_id,
      userId,
    );
    return authorizationGroupAccess;
  }
}
