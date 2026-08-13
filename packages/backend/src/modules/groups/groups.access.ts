import { PrismaClient } from '@prisma/client';
import { UserRoles } from '../../enums';

type GroupMembershipStore = Pick<PrismaClient, 'rbacGroupMember'>;
type GroupAccessStore = Pick<
  PrismaClient,
  'rbacGroup' | 'rbacGroupMember' | 'applicationAccessGroup' | 'role' | 'scopes'
>;
const ROLE_REVOCATION_BATCH_SIZE = 100;

export async function getAllGroupIdsForUser(
  prisma: GroupMembershipStore,
  userId: string,
): Promise<string[]> {
  const directMemberships = await prisma.rbacGroupMember.findMany({
    where: { member_user_id: userId },
    select: { parent_group_id: true },
  });

  const allGroupIds = new Set(directMemberships.map((membership) => membership.parent_group_id));
  let frontier = [...allGroupIds];

  while (frontier.length > 0) {
    const parentMemberships = await prisma.rbacGroupMember.findMany({
      where: {
        member_group_id: { in: frontier },
      },
      select: { parent_group_id: true },
    });

    const nextFrontier: string[] = [];

    for (const membership of parentMemberships) {
      if (!allGroupIds.has(membership.parent_group_id)) {
        allGroupIds.add(membership.parent_group_id);
        nextFrontier.push(membership.parent_group_id);
      }
    }

    frontier = nextFrontier;
  }

  return [...allGroupIds];
}

async function getAllParentGroupIds(
  prisma: GroupMembershipStore,
  groupId: string,
): Promise<string[]> {
  const allGroupIds = new Set([groupId]);
  let frontier = [groupId];

  while (frontier.length > 0) {
    const parentMemberships = await prisma.rbacGroupMember.findMany({
      where: {
        member_group_id: { in: frontier },
      },
      select: { parent_group_id: true },
    });

    const nextFrontier: string[] = [];

    for (const membership of parentMemberships) {
      if (!allGroupIds.has(membership.parent_group_id)) {
        allGroupIds.add(membership.parent_group_id);
        nextFrontier.push(membership.parent_group_id);
      }
    }

    frontier = nextFrontier;
  }

  return [...allGroupIds];
}

async function getAllDescendantGroupIds(
  prisma: GroupMembershipStore,
  groupId: string,
): Promise<string[]> {
  const allGroupIds = new Set([groupId]);
  let frontier = [groupId];

  while (frontier.length > 0) {
    const nestedMemberships = await prisma.rbacGroupMember.findMany({
      where: {
        parent_group_id: { in: frontier },
        member_group_id: { not: null },
      },
      select: { member_group_id: true },
    });

    const nextFrontier: string[] = [];

    for (const membership of nestedMemberships) {
      if (membership.member_group_id && !allGroupIds.has(membership.member_group_id)) {
        allGroupIds.add(membership.member_group_id);
        nextFrontier.push(membership.member_group_id);
      }
    }

    frontier = nextFrontier;
  }

  return [...allGroupIds];
}

async function revokeApplicationRoles(
  prisma: Pick<PrismaClient, 'role' | 'scopes'>,
  revocations: Array<{ userId: string; applicationIds: string[] }>,
) {
  for (let index = 0; index < revocations.length; index += ROLE_REVOCATION_BATCH_SIZE) {
    const batch = revocations.slice(index, index + ROLE_REVOCATION_BATCH_SIZE);
    const candidateWhere = {
      OR: batch.map(({ userId, applicationIds }) => ({
        user_id: userId,
        client_id: { in: applicationIds },
      })),
    };
    const revocableRoles = await prisma.role.findMany({
      where: {
        ...candidateWhere,
        role: { in: [UserRoles.USER, UserRoles.TRUSTED_USER] },
      },
      select: {
        user_id: true,
        client_id: true,
      },
    });

    if (!revocableRoles.length) {
      continue;
    }

    const revocableWhere = {
      OR: revocableRoles.map(({ user_id, client_id }) => ({
        user_id,
        client_id,
      })),
    };

    await prisma.role.deleteMany({ where: revocableWhere });
    await prisma.scopes.deleteMany({ where: revocableWhere });
  }
}

export async function removeUserGroupMembershipAndRevokeLostApplicationRoles(
  prisma: Pick<PrismaClient, 'rbacGroupMember' | 'applicationAccessGroup' | 'role' | 'scopes'>,
  params: {
    organizationId: string;
    groupId: string;
    membershipId: string;
    userId: string;
  },
) {
  const affectedGroupIds = await getAllParentGroupIds(prisma, params.groupId);
  const affectedApplicationLinks = await prisma.applicationAccessGroup.findMany({
    where: {
      organization_id: params.organizationId,
      group_id: { in: affectedGroupIds },
    },
    select: { application_id: true },
  });
  const candidateApplicationIds = Array.from(
    new Set(affectedApplicationLinks.map((link) => link.application_id)),
  );

  await prisma.rbacGroupMember.delete({
    where: { id: params.membershipId },
  });

  if (!candidateApplicationIds.length) {
    return [];
  }

  const remainingGroupIds = await getAllGroupIdsForUser(prisma, params.userId);
  const retainedApplicationLinks = remainingGroupIds.length
    ? await prisma.applicationAccessGroup.findMany({
        where: {
          organization_id: params.organizationId,
          application_id: { in: candidateApplicationIds },
          group_id: { in: remainingGroupIds },
        },
        select: { application_id: true },
      })
    : [];
  const retainedApplicationIds = new Set(
    retainedApplicationLinks.map((link) => link.application_id),
  );
  const lostApplicationIds = candidateApplicationIds.filter(
    (applicationId) => !retainedApplicationIds.has(applicationId),
  );

  if (!lostApplicationIds.length) {
    return [];
  }

  await revokeApplicationRoles(prisma, [
    { userId: params.userId, applicationIds: lostApplicationIds },
  ]);

  return lostApplicationIds;
}

export async function deleteGroupAndRevokeLostApplicationRoles(
  prisma: GroupAccessStore,
  params: {
    organizationId: string;
    groupId: string;
  },
) {
  const [affectedGroupIds, descendantGroupIds] = await Promise.all([
    getAllParentGroupIds(prisma, params.groupId),
    getAllDescendantGroupIds(prisma, params.groupId),
  ]);
  const [affectedApplicationLinks, affectedMemberships] = await Promise.all([
    prisma.applicationAccessGroup.findMany({
      where: {
        organization_id: params.organizationId,
        group_id: { in: affectedGroupIds },
      },
      select: { application_id: true },
    }),
    prisma.rbacGroupMember.findMany({
      where: {
        parent_group_id: { in: descendantGroupIds },
        member_user_id: { not: null },
      },
      select: { member_user_id: true },
    }),
  ]);
  const candidateApplicationIds = Array.from(
    new Set(affectedApplicationLinks.map((link) => link.application_id)),
  );
  const affectedUserIds = Array.from(
    new Set(
      affectedMemberships
        .map((membership) => membership.member_user_id)
        .filter((userId): userId is string => Boolean(userId)),
    ),
  );

  await prisma.rbacGroup.delete({
    where: { id: params.groupId },
  });

  if (!candidateApplicationIds.length || !affectedUserIds.length) {
    return [];
  }

  const [remainingDirectMemberships, remainingNestedMemberships] = await Promise.all([
    prisma.rbacGroupMember.findMany({
      where: {
        member_user_id: { in: affectedUserIds },
        parent_group: {
          client_id: params.organizationId,
        },
      },
      select: {
        member_user_id: true,
        parent_group_id: true,
      },
    }),
    prisma.rbacGroupMember.findMany({
      where: {
        member_group_id: { not: null },
        parent_group: {
          client_id: params.organizationId,
        },
      },
      select: {
        member_group_id: true,
        parent_group_id: true,
      },
    }),
  ]);
  const parentGroupIdsByChildId = new Map<string, string[]>();

  for (const membership of remainingNestedMemberships) {
    if (!membership.member_group_id) {
      continue;
    }

    const parentGroupIds = parentGroupIdsByChildId.get(membership.member_group_id) ?? [];
    parentGroupIds.push(membership.parent_group_id);
    parentGroupIdsByChildId.set(membership.member_group_id, parentGroupIds);
  }

  const effectiveGroupIdsByUserId = new Map(
    affectedUserIds.map((userId) => [userId, new Set<string>()]),
  );

  for (const membership of remainingDirectMemberships) {
    if (membership.member_user_id) {
      effectiveGroupIdsByUserId.get(membership.member_user_id)?.add(membership.parent_group_id);
    }
  }

  for (const groupIds of effectiveGroupIdsByUserId.values()) {
    const frontier = [...groupIds];

    while (frontier.length > 0) {
      const childGroupId = frontier.pop()!;

      for (const parentGroupId of parentGroupIdsByChildId.get(childGroupId) ?? []) {
        if (!groupIds.has(parentGroupId)) {
          groupIds.add(parentGroupId);
          frontier.push(parentGroupId);
        }
      }
    }
  }

  const remainingGroupIds = Array.from(
    new Set(Array.from(effectiveGroupIdsByUserId.values()).flatMap((groupIds) => [...groupIds])),
  );
  const retainedApplicationLinks = remainingGroupIds.length
    ? await prisma.applicationAccessGroup.findMany({
        where: {
          organization_id: params.organizationId,
          application_id: { in: candidateApplicationIds },
          group_id: { in: remainingGroupIds },
        },
        select: {
          application_id: true,
          group_id: true,
        },
      })
    : [];
  const applicationIdsByGroupId = new Map<string, string[]>();

  for (const link of retainedApplicationLinks) {
    const applicationIds = applicationIdsByGroupId.get(link.group_id) ?? [];
    applicationIds.push(link.application_id);
    applicationIdsByGroupId.set(link.group_id, applicationIds);
  }

  const revocations = affectedUserIds.flatMap((userId) => {
    const retainedApplicationIds = new Set<string>();

    for (const groupId of effectiveGroupIdsByUserId.get(userId) ?? []) {
      for (const applicationId of applicationIdsByGroupId.get(groupId) ?? []) {
        retainedApplicationIds.add(applicationId);
      }
    }

    const lostApplicationIds = candidateApplicationIds.filter(
      (applicationId) => !retainedApplicationIds.has(applicationId),
    );

    return lostApplicationIds.length ? [{ userId, applicationIds: lostApplicationIds }] : [];
  });

  await revokeApplicationRoles(prisma, revocations);

  return revocations;
}

export async function getApplicationAccessGroupIds(
  prisma: Pick<PrismaClient, 'applicationAccessGroup'>,
  organizationId: string,
  applicationId: string,
): Promise<string[]> {
  const groups = await prisma.applicationAccessGroup.findMany({
    where: {
      organization_id: organizationId,
      application_id: applicationId,
    },
    select: {
      group_id: true,
    },
  });

  return groups.map((group) => group.group_id);
}

export async function hasApplicationAccessForUser(
  prisma: Pick<PrismaClient, 'applicationAccessGroup' | 'rbacGroupMember'>,
  organizationId: string,
  applicationId: string,
  userId: string,
): Promise<boolean> {
  const [groupIds, userGroupIds] = await Promise.all([
    getApplicationAccessGroupIds(prisma, organizationId, applicationId),
    getAllGroupIdsForUser(prisma, userId),
  ]);

  if (!groupIds.length || !userGroupIds.length) {
    return false;
  }

  const groupIdSet = new Set(groupIds);
  return userGroupIds.some((groupId) => groupIdSet.has(groupId));
}

export async function replaceApplicationAccessGroups(
  prisma: Pick<PrismaClient, 'applicationAccessGroup'>,
  organizationId: string,
  applicationId: string,
  groupIds: string[],
  createdBy?: string | null,
) {
  const uniqueGroupIds = Array.from(new Set(groupIds));

  await prisma.applicationAccessGroup.deleteMany({
    where: {
      organization_id: organizationId,
      application_id: applicationId,
    },
  });

  if (!uniqueGroupIds.length) {
    return [];
  }

  await prisma.applicationAccessGroup.createMany({
    data: uniqueGroupIds.map((groupId) => ({
      organization_id: organizationId,
      application_id: applicationId,
      group_id: groupId,
      created_by: createdBy ?? null,
    })),
    skipDuplicates: true,
  });

  return uniqueGroupIds;
}
