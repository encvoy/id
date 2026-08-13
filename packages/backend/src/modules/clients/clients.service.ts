import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Injectable,
  Inject,
  InternalServerErrorException,
  OnModuleInit,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DefaultArgs } from '@prisma/client/runtime/library';
import { ListInputDto } from 'src/custom.dto';
import {
  buildClientNameSearchConditions,
  buildLocalizedClientFieldSearchConditions,
  getClientCatalogDisplayName,
  getLocalizedClientSortContext,
  sortItemsByLocalizedClientName,
} from 'src/utils/localized-client-name';
import { createLocalizedTextFallback, resolveLocalizedText } from 'src/utils/localized-text';
import { CLIENT_ID, DOMAIN, PROVIDER_TYPE_CREDENTIALS, setClientId } from '../../constants';
import { Ei18nCodes, ELocales, SortDirection, UserRoles } from '../../enums';
import {
  convertToRoles,
  deleteImageFromLocalPath,
  generateRandomString,
  getOrganizationId,
} from '../../helpers';
import { CallEventNames, CallEventsService, OrganizationAfterCreatedPayload } from '../call-events';
import { CustomLogger } from '../logger/logger.service';
import {
  ensureOrganizationGuestsGroup,
  syncGuestsMembershipForUser,
  syncOrganizationGuestsMembershipForUser,
} from '../prisma/guests-group';
import { prisma } from '../prisma/prisma.client';
import { EmailService } from '../providers/collection/email/email.service';
import { NotificationAction } from '../providers/collection/email/email.types';
import { redisClient } from '../redis/redis.client';
import { RedisAdapter } from '../redis/redis.adapter';
import { RoleRepository, UserModel } from '../repository';
import { legacyUserInclude, toLegacyUser, withLegacyUserBlocked } from '../repository/user-compat';
import {
  getLegacyUserPrimaryExternalAccountEmail,
  legacyUserEmailExternalAccountTypes,
  matchesLegacyUserEmailSearch,
} from '../repository/user-search';
import {
  buildManagedUserAccessContext,
  canManageTargetUser,
  canManageTargetUserByContext,
  TManagedUserAccessContext,
} from '../users/user-access';
import { toPublicLegacyUser, toUserProfileResponse } from '../users/user-visibility';
import { CreateUserDTO } from '../users/users.dto';
import { UsersService } from '../users/users.service';
import { BrandingIconsService } from './branding-icons.service';
import * as dto from './clients.dto';
import { canTransferOrganizationOwner } from './organization-owner-access';

const clientUserListProfileFieldKeys = [
  'family_name',
  'given_name',
  'nickname',
  'email',
  'login',
  'phone_number',
  'picture',
] as const;
const generalProfileFieldKeys = [
  'sub',
  'login',
  'email',
  'birthdate',
  'family_name',
  'given_name',
  'nickname',
  'phone_number',
  'picture',
  'data_processing_agreement',
  'password',
] as const;

const MAX_OWNED_ORGANIZATIONS = 3;
const supportedUserListFilterKeys = ['role', 'group_id', 'group_membership'] as const;
const userListGroupMembershipValues = ['member', 'non_member'] as const;
const WHITE_LIST_CACHE_KEY = 'runtime';
const WHITE_LIST_CACHE_PREFIX = 'ClientWhiteListCache';
const WHITE_LIST_REDIS_CHANNEL = 'runtime:white-list:changed';

type TUserListGroupMembership = (typeof userListGroupMembershipValues)[number];
type ClientWhiteListPayload = {
  origins: string[];
  system_client_id: string;
};

const clientUserListInclude = {
  profile_values: {
    where: {
      profile_field: {
        key: {
          in: [...clientUserListProfileFieldKeys],
        },
      },
    },
    include: {
      profile_field: {
        select: {
          key: true,
          default_public: true,
        },
      },
    },
  },
  externalAccounts: {
    where: {
      type: {
        in: [...legacyUserEmailExternalAccountTypes],
      },
    },
  },
  roles: {
    where: {
      client_id: CLIENT_ID,
    },
    select: {
      role: true,
      client_id: true,
      blocked: true,
      client: {
        select: {
          parent_id: true,
        },
      },
    },
  },
  organization: {
    select: {
      name: true,
    },
  },
} satisfies Prisma.UserInclude;

type ClientListUser = Pick<
  UserModel,
  'id' | 'family_name' | 'given_name' | 'nickname' | 'picture' | 'blocked' | 'deleted' | 'org_id'
> & {
  organization_name: string | null;
  groupsCount: number;
};

type ClientOwnerSummary = {
  id: string;
  display_name: string;
  email: string | null;
} | null;

const getOptionalString = (value: unknown) => (typeof value === 'string' ? value : '');

const getLegacyUserDisplayName = (user: ReturnType<typeof toLegacyUser>): string => {
  if (!user) {
    return '';
  }

  const fullName = [user.given_name, user.family_name].filter(Boolean).join(' ').trim();
  return (
    fullName ||
    user.nickname ||
    user.login ||
    (user.email_verified ? user.email || '' : '') ||
    `User #${user.id}`
  );
};

const toClientOwnerSummary = (user: ReturnType<typeof toLegacyUser>): ClientOwnerSummary => {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    display_name: getLegacyUserDisplayName(user),
    email: user.email_verified ? user.email || null : null,
  };
};

const getClientActivity30d = async (clientIds: string[]) => {
  if (!clientIds.length) {
    return new Map<string, number>();
  }

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const activity = await prisma.log.groupBy({
    by: ['client_id'],
    where: {
      client_id: { in: clientIds },
      date: { gte: since },
    },
    _count: {
      _all: true,
    },
  });

  return new Map(
    activity
      .filter((item) => Boolean(item.client_id))
      .map((item) => [item.client_id as string, item._count._all]),
  );
};

const normalizePhone = (value: string | undefined) => value?.replace(/\D/g, '') || '';

const getLegacyFieldValue = (user: UserModel, field: string): string => {
  switch (field) {
    case 'id':
      return user.id;
    case 'family_name':
      return user.family_name || '';
    case 'given_name':
      return user.given_name || '';
    case 'nickname':
      return user.nickname || '';
    case 'email':
      return getLegacyUserPrimaryExternalAccountEmail(user) || '';
    case 'login':
      return user.login || '';
    case 'phone_number':
      return user.phone_number || '';
    default:
      return getOptionalString((user as Record<string, unknown>)[field]);
  }
};

export const matchesUsersSearch = (
  user: UserModel,
  search_string: string | undefined,
  search_filter: string[] | undefined,
): boolean => {
  if (!search_string) {
    return true;
  }

  const normalizedSearch = search_string.toLowerCase();
  const searchCriteria = search_string?.replace(/\D/g, '');
  const hasInvalidCharacters = /[^0-9\s\+\-\(\)]/.test(search_string);

  const fields =
    !search_filter || search_filter.includes('all') || !search_filter.length
      ? ['family_name', 'given_name', 'nickname', 'email', 'login', 'phone_number', 'id']
      : search_filter;

  return fields.some((field) => {
    if (field === 'id') {
      return user.id === search_string;
    }

    if (field === 'email') {
      return matchesLegacyUserEmailSearch(user, normalizedSearch);
    }

    if (field === 'phone_number') {
      return !!searchCriteria && !hasInvalidCharacters
        ? normalizePhone(user.phone_number).includes(searchCriteria)
        : false;
    }

    return getLegacyFieldValue(user, field).toLowerCase().includes(normalizedSearch);
  });
};

const compareStrings = (left: string, right: string, direction: SortDirection) => {
  const result = left.localeCompare(right, undefined, { sensitivity: 'base' });
  return direction === SortDirection.DESC ? -result : result;
};

const compareBooleans = (left: boolean, right: boolean, direction: SortDirection) => {
  if (left === right) {
    return 0;
  }

  const result = left ? 1 : -1;
  return direction === SortDirection.DESC ? -result : result;
};

const normalizeClientNameInput = (
  value: unknown,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined => {
  if (value === null) {
    return Prisma.JsonNull;
  }

  if (typeof value === 'string') {
    if (!value.trim()) {
      return Prisma.JsonNull;
    }

    return createLocalizedTextFallback(value) as Prisma.InputJsonValue;
  }

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const values = Object.values(value as Record<string, unknown>);
    const hasNonEmptyValue = values.some(
      (item) => typeof item === 'string' && item.trim().length > 0,
    );

    if (!hasNonEmptyValue) {
      return Prisma.JsonNull;
    }

    return value as Prisma.InputJsonValue;
  }

  return undefined;
};

const toClientListUser = (
  user: Pick<
    UserModel,
    'id' | 'family_name' | 'given_name' | 'nickname' | 'picture' | 'blocked' | 'deleted' | 'org_id'
  >,
  organizationName?: string | null,
  groupsCount = 0,
): ClientListUser => ({
  id: user.id,
  family_name: user.family_name || '',
  given_name: user.given_name || '',
  nickname: user.nickname || '',
  picture: user.picture || '',
  blocked: Boolean(user.blocked),
  deleted: user.deleted,
  org_id: user.org_id ?? null,
  organization_name: organizationName || null,
  groupsCount,
});

const sliceItemsByOffset = <T>(items: T[], limit?: number, offset?: number) => {
  const safeOffset = offset && offset > 0 ? offset : 0;
  const end = typeof limit === 'number' ? safeOffset + limit : undefined;

  return items.slice(safeOffset, end);
};

const sliceItemsByCursor = <T>(
  items: T[],
  options: {
    number_of_records?: string;
    number_of_skip?: string;
    last_record_id?: string;
    getClientId: (item: T) => string;
  },
) => {
  const { getClientId, last_record_id, number_of_records, number_of_skip } = options;
  let startIndex = 0;

  if (last_record_id) {
    const cursorIndex = items.findIndex((item) => getClientId(item) === last_record_id);
    startIndex = cursorIndex >= 0 ? cursorIndex + 1 : items.length;
  } else if (number_of_skip) {
    const parsedSkip = parseInt(number_of_skip, 10);
    startIndex = Number.isNaN(parsedSkip) || parsedSkip < 0 ? 0 : parsedSkip;
  }

  const parsedLimit = number_of_records ? parseInt(number_of_records, 10) : undefined;
  const end =
    typeof parsedLimit === 'number' && !Number.isNaN(parsedLimit) && parsedLimit > 0
      ? startIndex + parsedLimit
      : undefined;

  return items.slice(startIndex, end);
};

const clientUserSearchFieldIds = [
  'family_name',
  'given_name',
  'nickname',
  'email',
  'login',
  'phone_number',
] as const;

type ClientUserListRow = {
  user_id: string;
  role: string;
  blocked: boolean;
  deleted: Date | null;
  family_name: string | null;
  given_name: string | null;
  nickname: string | null;
  email: string | null;
  login: string | null;
  phone_number: string | null;
};

const escapeLikePattern = (value: string) => value.replace(/[\\%_]/g, '\\$&');

const getClientUsersProfileFieldIds = (sortBy?: string, search?: string) => {
  const fieldIds = new Set<string>();
  if (search) {
    clientUserSearchFieldIds.forEach((fieldId) => fieldIds.add(fieldId));
  }

  if (sortBy === 'nickname') {
    fieldIds.add('nickname');
  }

  return Array.from(fieldIds);
};

const buildClientUsersBaseQuery = (
  client_id: string,
  profileFieldIds: string[],
  includeExternalEmailSearch: boolean,
  roleFilter?: string,
) => {
  if (profileFieldIds.length === 0) {
    return Prisma.sql`
      SELECT
        r.user_id,
        r.role,
        r.blocked,
        u.deleted,
        NULL::text AS family_name,
        NULL::text AS given_name,
        NULL::text AS nickname,
        NULL::text AS email,
        NULL::text AS login,
        NULL::text AS phone_number,
        ${
          includeExternalEmailSearch
            ? Prisma.sql`STRING_AGG(DISTINCT LOWER(ea.sub), ' ')`
            : Prisma.sql`NULL::text`
        } AS external_email_search
      FROM "Role" r
      JOIN "User" u ON u.id = r.user_id
      ${
        includeExternalEmailSearch
          ? Prisma.sql`
              LEFT JOIN "ExternalAccount" ea
                ON ea.user_id = u.id
               AND ea.type IN (${Prisma.join(legacyUserEmailExternalAccountTypes)})
            `
          : Prisma.empty
      }
      WHERE r.client_id = ${client_id}
        ${roleFilter ? Prisma.sql`AND r.role = ${roleFilter}` : Prisma.empty}
        AND NOT EXISTS (
          SELECT 1
          FROM "Role" root_role
          WHERE root_role.user_id = r.user_id
            AND root_role.client_id = ${CLIENT_ID}
            AND root_role.role = ${UserRoles.OWNER}
        )
      GROUP BY r.user_id, r.role, r.blocked, u.deleted
    `;
  }

  return Prisma.sql`
    SELECT
      r.user_id,
      r.role,
      r.blocked,
      u.deleted,
      MAX(CASE WHEN upv.profile_field_id = 'family_name' THEN upv.value #>> '{}' END) AS family_name,
      MAX(CASE WHEN upv.profile_field_id = 'given_name' THEN upv.value #>> '{}' END) AS given_name,
      MAX(CASE WHEN upv.profile_field_id = 'nickname' THEN upv.value #>> '{}' END) AS nickname,
      MAX(CASE WHEN upv.profile_field_id = 'email' THEN upv.value #>> '{}' END) AS email,
      MAX(CASE WHEN upv.profile_field_id = 'login' THEN upv.value #>> '{}' END) AS login,
      MAX(CASE WHEN upv.profile_field_id = 'phone_number' THEN upv.value #>> '{}' END) AS phone_number,
      ${
        includeExternalEmailSearch
          ? Prisma.sql`STRING_AGG(DISTINCT LOWER(ea.sub), ' ')`
          : Prisma.sql`NULL::text`
      } AS external_email_search
    FROM "Role" r
    JOIN "User" u ON u.id = r.user_id
    LEFT JOIN "UserProfileValue" upv
      ON upv.user_id = u.id
     AND upv.profile_field_id IN (${Prisma.join(profileFieldIds)})
    ${
      includeExternalEmailSearch
        ? Prisma.sql`
            LEFT JOIN "ExternalAccount" ea
              ON ea.user_id = u.id
             AND ea.type IN (${Prisma.join(legacyUserEmailExternalAccountTypes)})
          `
        : Prisma.empty
    }
    WHERE r.client_id = ${client_id}
      ${roleFilter ? Prisma.sql`AND r.role = ${roleFilter}` : Prisma.empty}
      AND NOT EXISTS (
        SELECT 1
        FROM "Role" root_role
        WHERE root_role.user_id = r.user_id
          AND root_role.client_id = ${CLIENT_ID}
          AND root_role.role = ${UserRoles.OWNER}
      )
    GROUP BY r.user_id, r.role, r.blocked, u.deleted
  `;
};

const buildClientUsersSearchClause = (search?: string) => {
  if (!search) {
    return Prisma.empty;
  }

  const normalizedSearch = search.toLowerCase();
  const textPattern = `%${escapeLikePattern(normalizedSearch)}%`;
  const searchCriteria = search.replace(/\D/g, '');
  const hasInvalidCharacters = /[^0-9\s\+\-\(\)]/.test(search);
  const phoneClause =
    searchCriteria && !hasInvalidCharacters
      ? Prisma.sql`
          OR REGEXP_REPLACE(COALESCE(phone_number, ''), '\\D', '', 'g') LIKE ${`%${searchCriteria}%`} ESCAPE '\\'
        `
      : Prisma.empty;

  return Prisma.sql`
    WHERE (
      user_id = ${search}
      OR LOWER(COALESCE(family_name, '')) LIKE ${textPattern} ESCAPE '\\'
      OR LOWER(COALESCE(given_name, '')) LIKE ${textPattern} ESCAPE '\\'
      OR LOWER(COALESCE(nickname, '')) LIKE ${textPattern} ESCAPE '\\'
      OR LOWER(COALESCE(email, '')) LIKE ${textPattern} ESCAPE '\\'
      OR COALESCE(external_email_search, '') LIKE ${textPattern} ESCAPE '\\'
      OR LOWER(COALESCE(login, '')) LIKE ${textPattern} ESCAPE '\\'
      ${phoneClause}
    )
  `;
};

const buildClientUsersOrderByClause = (
  sortBy?: string,
  sortDirection: SortDirection = SortDirection.ASC,
) => {
  const directionSql = sortDirection === SortDirection.DESC ? Prisma.sql`DESC` : Prisma.sql`ASC`;
  const reversedDirectionSql =
    sortDirection === SortDirection.DESC ? Prisma.sql`ASC` : Prisma.sql`DESC`;

  switch (sortBy) {
    case 'role':
      return Prisma.sql`LOWER(COALESCE(role, '')) ${directionSql}, user_id ASC`;
    case 'nickname':
      return Prisma.sql`LOWER(COALESCE(nickname, '')) ${directionSql}, user_id ASC`;
    case 'status':
      return Prisma.sql`
        blocked ${reversedDirectionSql},
        COALESCE(deleted::text, '') ${directionSql},
        user_id ASC
      `;
    default:
      return Prisma.sql`user_id ASC`;
  }
};

const CLIENT_FIELDS_NOT_EDITABLE = [
  'redirect_uris',
  'post_logout_redirect_uris',
  'client_id',
  'client_secret',
  'request_uris',
  'introspection_endpoint_auth_method',
  'token_endpoint_auth_method',
  'revocation_endpoint_auth_method',
  'require_signed_request_object',
  'id_token_signed_response_alg',
  'require_auth_time',
  'response_types',
  'subject_type',
  'subject_types_supported',
];

@Injectable()
export class ClientService implements OnModuleInit {
  private readonly whiteListCache = new RedisAdapter(WHITE_LIST_CACHE_PREFIX);
  private readonly whiteListPublisher = redisClient('client-white-list');

  private canManageOrganizationUsers(
    accessContext: TManagedUserAccessContext | null | undefined,
    organizationId?: string | null,
  ) {
    if (!accessContext) {
      return true;
    }

    if (accessContext.isSystemManager) {
      return true;
    }

    if (!organizationId || organizationId === CLIENT_ID) {
      return false;
    }

    return accessContext.managedOrganizationIds.has(organizationId);
  }

  private async assertCanManageOrganizationUsers(
    actorUserId: string | undefined,
    organizationId?: string | null,
  ) {
    if (!actorUserId) {
      return;
    }

    const accessContext = await buildManagedUserAccessContext(actorUserId);
    if (!this.canManageOrganizationUsers(accessContext, organizationId)) {
      throw new ForbiddenException('Insufficient access rights');
    }
  }

  private async assertCanTransferOrganizationOwner(
    actorUserId: string | undefined,
    organizationId: string,
  ) {
    if (!actorUserId) {
      throw new ForbiddenException(Ei18nCodes.T3E0026);
    }

    const roles = await prisma.role.findMany({
      where: {
        user_id: actorUserId,
        client_id: {
          in: [CLIENT_ID, organizationId],
        },
      },
      select: {
        client_id: true,
        role: true,
      },
    });
    const systemRole = roles.find((role) => role.client_id === CLIENT_ID)?.role as
      | UserRoles
      | undefined;
    const organizationRole = roles.find((role) => role.client_id === organizationId)?.role as
      | UserRoles
      | undefined;

    if (!canTransferOrganizationOwner(systemRole, organizationRole)) {
      throw new ForbiddenException(Ei18nCodes.T3E0026);
    }
  }

  constructor(
    private readonly redis: RedisAdapter,
    private readonly roleRepo: RoleRepository,
    @Inject(forwardRef(() => UsersService))
    private readonly userService: UsersService,
    private readonly mailService: EmailService,
    private readonly logger: CustomLogger,
    private readonly callEventsService: CallEventsService,
    private readonly brandingIconsService: BrandingIconsService,
  ) {}

  async onModuleInit() {
    try {
      await this.getWhiteList(true);
    } catch (error) {
      this.logger.warn(
        `[ClientService] Failed to sync runtime white-list cache on startup: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private getVisibleCustomFieldOrganizationIds(organizationId: string) {
    return organizationId === CLIENT_ID ? [CLIENT_ID] : [CLIENT_ID, organizationId];
  }

  private async filterUserProfileForClient(user: UserModel | null, clientId: string) {
    if (!user?.custom_fields) {
      return user;
    }

    const organizationId = await getOrganizationId(clientId);
    const profileFields = await prisma.profileField.findMany({
      where: {
        key: { notIn: [...generalProfileFieldKeys] },
        organization_id: {
          in: this.getVisibleCustomFieldOrganizationIds(organizationId),
        },
      },
      select: { key: true },
    });
    const visibleFieldKeys = new Set(profileFields.map((field) => field.key));
    const customFields = Object.fromEntries(
      Object.entries(user.custom_fields).filter(([key]) => visibleFieldKeys.has(key)),
    );

    return {
      ...user,
      custom_fields: Object.keys(customFields).length ? customFields : undefined,
    };
  }

  private async resolveClientFolderId(
    tx: Prisma.TransactionClient,
    clientId: string,
  ): Promise<string> {
    const client = await tx.client.findUnique({
      where: { client_id: clientId },
      select: {
        folder_id: true,
      },
    });

    if (client?.folder_id) {
      return client.folder_id;
    }

    const directoryFolder = await tx.folder.findFirst({
      where: {
        client_id: clientId,
        name: 'Directory',
        parent_id: null,
      },
      select: {
        id: true,
      },
    });

    if (!directoryFolder) {
      throw new NotFoundException('Directory folder not found for client');
    }

    return directoryFolder.id;
  }

  private async getOrganizationClientIds(
    tx: Prisma.TransactionClient,
    organizationId: string,
  ): Promise<string[]> {
    const clients = await tx.client.findMany({
      where: {
        OR: [{ client_id: organizationId }, { parent_id: organizationId }],
      },
      select: {
        client_id: true,
      },
    });

    return clients.map((client) => client.client_id);
  }

  private async countOwnedOrganizations(userId: string): Promise<number> {
    return prisma.role.count({
      where: {
        user_id: userId,
        role: UserRoles.OWNER,
        client: {
          parent_id: null,
          client_id: {
            not: CLIENT_ID,
          },
        },
      },
    });
  }

  private async clearTrustedMembershipData(tx: Prisma.TransactionClient, userId: string) {
    await tx.role.updateMany({
      where: {
        user_id: userId,
        role: UserRoles.TRUSTED_USER,
      },
      data: {
        role: UserRoles.USER,
      },
    });
  }

  private async addUserToOrganizationGuestsGroup(
    tx: Prisma.TransactionClient,
    userId: string,
    organizationId: string,
  ) {
    const guestsGroup = await ensureOrganizationGuestsGroup(tx, organizationId);

    if (!guestsGroup) {
      return;
    }

    await tx.rbacGroupMember.createMany({
      data: [
        {
          parent_group_id: guestsGroup.id,
          member_user_id: userId,
        },
      ],
      skipDuplicates: true,
    });
  }

  private async resolveUserPlacementForRoleUpdate(
    tx: Prisma.TransactionClient,
    userId: string,
    client: { client_id: string; parent_id: string | null },
    targetRole: UserRoles,
    organizationId: string,
  ): Promise<Prisma.UserUncheckedUpdateInput> {
    const resolvePlacement = async (
      orgId: string | null,
    ): Promise<Prisma.UserUncheckedUpdateInput> => ({
      org_id: orgId,
      folder_id: await this.resolveClientFolderId(tx, orgId ?? CLIENT_ID),
    });

    switch (targetRole) {
      case UserRoles.TRUSTED_USER:
        return {};
      case UserRoles.MANAGER:
        return resolvePlacement(null);
      case UserRoles.EDITOR:
        if (client.client_id === CLIENT_ID || client.parent_id === null) {
          return resolvePlacement(client.client_id === CLIENT_ID ? CLIENT_ID : organizationId);
        }
        return {};
      case UserRoles.USER:
      default:
        return {};
    }
  }

  private sortRoleUsers<T extends { role: string; user: UserModel }>(
    items: T[],
    sortBy: string,
    sortDirection: SortDirection,
  ): T[] {
    return [...items].sort((left, right) => {
      switch (sortBy) {
        case 'role': {
          const byRole = compareStrings(left.role, right.role, sortDirection);
          return byRole || compareStrings(left.user.id, right.user.id, SortDirection.ASC);
        }
        case 'nickname': {
          const byNickname = compareStrings(
            left.user.nickname || '',
            right.user.nickname || '',
            sortDirection,
          );
          return byNickname || compareStrings(left.user.id, right.user.id, SortDirection.ASC);
        }
        case 'status': {
          const byBlocked = compareBooleans(
            !!left.user.blocked,
            !!right.user.blocked,
            sortDirection === SortDirection.ASC ? SortDirection.DESC : SortDirection.ASC,
          );
          if (byBlocked) {
            return byBlocked;
          }

          const byDeleted = compareStrings(
            left.user.deleted ? new Date(left.user.deleted).toISOString() : '',
            right.user.deleted ? new Date(right.user.deleted).toISOString() : '',
            sortDirection,
          );
          return byDeleted || compareStrings(left.user.id, right.user.id, SortDirection.ASC);
        }
        default:
          return compareStrings(left.user.id, right.user.id, SortDirection.ASC);
      }
    });
  }

  private mapClientRule(profileField: {
    id: string;
    key: string;
    title: Prisma.JsonValue;
    default_value: Prisma.JsonValue | null;
    required: boolean;
    unique: boolean;
    active: boolean;
    editable: boolean;
    validations: Array<{ rule_validation: Prisma.RuleValidationGetPayload<Record<string, never>> }>;
  }) {
    return {
      id: profileField.id,
      field_name: profileField.key,
      title: profileField.title,
      default:
        typeof profileField.default_value === 'string' ||
        typeof profileField.default_value === 'number' ||
        typeof profileField.default_value === 'boolean'
          ? String(profileField.default_value)
          : undefined,
      required: profileField.required,
      unique: profileField.unique,
      active: profileField.active,
      editable: profileField.editable,
      validations: profileField.validations.map((validation) => validation.rule_validation),
    };
  }

  private async getClientRoleUsers(client_id: string) {
    const roles = await prisma.role.findMany({
      where: {
        client_id,
        user: {
          roles: {
            none: {
              client_id: CLIENT_ID,
              role: UserRoles.OWNER,
            },
          },
        },
      },
      include: {
        user: {
          include: clientUserListInclude,
        },
      },
    });

    return roles
      .map((item) => ({
        role: item.role,
        organization_name: item.user.organization?.name || null,
        user: (() => {
          const legacyUser = toLegacyUser(item.user as Parameters<typeof toLegacyUser>[0]);
          return legacyUser ? { ...legacyUser, blocked: item.blocked } : null;
        })(),
      }))
      .filter(
        (item): item is { role: string; organization_name: string | null; user: UserModel } =>
          !!item.user,
      );
  }

  private async loadUserGroupCounts(userIds: string[], clientId: string) {
    if (!userIds.length) {
      return new Map<string, number>();
    }

    const organizationId = await getOrganizationId(clientId);
    const counts = await prisma.rbacGroupMember.groupBy({
      by: ['member_user_id'],
      where: {
        member_user_id: {
          in: userIds,
        },
        parent_group: {
          client_id: organizationId,
        },
      },
      _count: {
        _all: true,
      },
    });

    return new Map(
      counts
        .filter((item): item is typeof item & { member_user_id: string } =>
          Boolean(item.member_user_id),
        )
        .map((item) => [item.member_user_id, item._count._all]),
    );
  }

  private getValidatedUserListGroupMembershipFilter(filter?: Record<string, unknown>) {
    if (!filter) {
      return null;
    }

    const rawGroupId = filter.group_id;
    const rawGroupMembership = filter.group_membership;

    if (rawGroupId !== undefined && typeof rawGroupId !== 'string') {
      throw new BadRequestException('group_id filter must be a string');
    }

    if (rawGroupMembership === undefined) {
      return null;
    }

    if (!userListGroupMembershipValues.includes(rawGroupMembership as TUserListGroupMembership)) {
      throw new BadRequestException(
        'group_membership filter must be either "member" or "non_member"',
      );
    }

    const normalizedGroupId = typeof rawGroupId === 'string' ? rawGroupId.trim() : '';

    if (!normalizedGroupId) {
      throw new BadRequestException(
        'group_id filter is required when group_membership filter is provided',
      );
    }

    return {
      groupId: normalizedGroupId,
      membership: rawGroupMembership as TUserListGroupMembership,
    };
  }

  private async loadGroupMemberUserIds(groupId: string, clientId: string) {
    const organizationId = await getOrganizationId(clientId);
    const group = await prisma.rbacGroup.findFirst({
      where: {
        id: groupId,
        client_id: organizationId,
      },
      select: {
        id: true,
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const members = await prisma.rbacGroupMember.findMany({
      where: {
        parent_group_id: groupId,
        member_user_id: {
          not: null,
        },
      },
      select: {
        member_user_id: true,
      },
    });

    return new Set(
      members
        .map((item) => item.member_user_id)
        .filter((memberUserId): memberUserId is string => Boolean(memberUserId)),
    );
  }

  private hasUnsupportedUserListFilter(filter?: Record<string, unknown>) {
    if (!filter || Object.keys(filter).length === 0) {
      return false;
    }

    const groupMembershipFilter = this.getValidatedUserListGroupMembershipFilter(filter);

    if (groupMembershipFilter || typeof filter.group_id === 'string') {
      return true;
    }

    return (
      Object.keys(filter).some(
        (key) =>
          !supportedUserListFilterKeys.includes(
            key as (typeof supportedUserListFilterKeys)[number],
          ),
      ) || typeof filter.role !== 'string'
    );
  }

  private async listUsersInMemoryWithContext(
    params: ListInputDto,
    client_id: string,
    accessContext?: TManagedUserAccessContext,
  ) {
    const { filter, limit, sortBy, sortDirection, offset, search } = params;
    const groupMembershipFilter = this.getValidatedUserListGroupMembershipFilter(filter);
    const groupMemberUserIds = groupMembershipFilter
      ? await this.loadGroupMemberUserIds(groupMembershipFilter.groupId, client_id)
      : null;
    const rawItems = await this.getClientRoleUsers(client_id);
    const visibleItems = rawItems
      .map((item) => {
        if (!item.user) {
          return null;
        }

        const canManageUser = accessContext
          ? canManageTargetUserByContext(accessContext, item.user.id, item.user.org_id)
          : true;
        const visibleUser = canManageUser ? item.user : toPublicLegacyUser(item.user);

        return {
          organization_name: item.organization_name,
          role: item.role,
          user: visibleUser as UserModel,
        };
      })
      .filter(
        (
          item,
        ): item is {
          organization_name: string | null;
          role: string;
          user: UserModel;
        } => Boolean(item?.user),
      );

    const filteredItems = visibleItems.filter((item) => {
      if (!matchesUsersSearch(item.user, search, undefined)) {
        return false;
      }

      if (groupMembershipFilter) {
        const isMember = groupMemberUserIds?.has(item.user.id) ?? false;

        if (groupMembershipFilter.membership === 'member' && !isMember) {
          return false;
        }

        if (groupMembershipFilter.membership === 'non_member' && isMember) {
          return false;
        }
      }

      return Object.entries(filter || {})
        .filter(([key]) => key !== 'group_id' && key !== 'group_membership')
        .every(([key, value]) => (item as Record<string, unknown>)[key] === value);
    });
    const sortedItems = this.sortRoleUsers(filteredItems, sortBy, sortDirection);
    const pageItems = sortedItems.slice(offset || 0, (offset || 0) + limit);
    const groupCounts = await this.loadUserGroupCounts(
      pageItems.map((item) => item.user.id),
      client_id,
    );

    return {
      items: pageItems.map((item) => ({
        role: item.role,
        user: toClientListUser(
          item.user,
          item.organization_name,
          groupCounts.get(item.user.id) ?? 0,
        ),
      })),
      totalCount: filteredItems.length,
    };
  }

  private async listUsersOptimized(params: ListInputDto, client_id: string, roleFilter?: string) {
    const { limit, sortBy, sortDirection, offset, search } = params;
    const profileFieldIds = getClientUsersProfileFieldIds(sortBy, search);
    const includeExternalEmailSearch = Boolean(search?.trim());
    const baseQuery = buildClientUsersBaseQuery(
      client_id,
      profileFieldIds,
      includeExternalEmailSearch,
      roleFilter,
    );
    const searchClause = buildClientUsersSearchClause(search);
    const orderByClause = buildClientUsersOrderByClause(sortBy, sortDirection);
    const paginationSql = Prisma.sql`
      ${limit !== undefined ? Prisma.sql`LIMIT ${limit}` : Prisma.empty}
      ${offset !== undefined ? Prisma.sql`OFFSET ${offset}` : Prisma.empty}
    `;
    const totalCountPromise = search
      ? prisma.$queryRaw<Array<{ total_count: number }>>(Prisma.sql`
          WITH role_users AS (
            ${baseQuery}
          )
          SELECT COUNT(*)::int AS total_count
          FROM role_users
          ${searchClause}
        `)
      : prisma.role.count({
          where: {
            client_id,
            ...(roleFilter ? { role: roleFilter } : {}),
            user: {
              roles: {
                none: {
                  client_id: CLIENT_ID,
                  role: UserRoles.OWNER,
                },
              },
            },
          },
        });

    const [pageRows, totalCount] = await Promise.all([
      prisma.$queryRaw<Array<{ user_id: string; role: string }>>(Prisma.sql`
        WITH role_users AS (
          ${baseQuery}
        )
        SELECT user_id, role
        FROM role_users
        ${searchClause}
        ORDER BY ${orderByClause}
        ${paginationSql}
      `),
      totalCountPromise,
    ]);

    if (!pageRows.length) {
      return {
        items: [],
        totalCount: Array.isArray(totalCount) ? totalCount[0]?.total_count ?? 0 : totalCount,
      };
    }

    const pageUserIds = pageRows.map((row) => row.user_id);
    const [pageRoles, groupCounts] = await Promise.all([
      prisma.role.findMany({
        where: {
          client_id,
          user_id: {
            in: pageUserIds,
          },
          user: {
            roles: {
              none: {
                client_id: CLIENT_ID,
                role: UserRoles.OWNER,
              },
            },
          },
        },
        include: {
          user: {
            include: clientUserListInclude,
          },
        },
      }),
      this.loadUserGroupCounts(pageUserIds, client_id),
    ]);

    const pageRolesByUserId = new Map(pageRoles.map((item) => [item.user_id, item]));
    const items = pageRows
      .map((row) => {
        const roleWithUser = pageRolesByUserId.get(row.user_id);
        const user = (() => {
          if (!roleWithUser) {
            return null;
          }

          const legacyUser = toLegacyUser(roleWithUser.user as Parameters<typeof toLegacyUser>[0]);
          return legacyUser ? { ...legacyUser, blocked: roleWithUser.blocked } : null;
        })();
        if (!user) {
          return null;
        }

        return {
          role: row.role,
          user: toClientListUser(
            user,
            resolveLocalizedText(roleWithUser.user.organization?.name, ELocales.ru, ELocales.ru) ||
              null,
            groupCounts.get(user.id) ?? 0,
          ),
        };
      })
      .filter(
        (
          item,
        ): item is {
          role: string;
          user: ClientListUser;
        } => Boolean(item),
      );

    return {
      items,
      totalCount: Array.isArray(totalCount) ? totalCount[0]?.total_count ?? 0 : totalCount,
    };
  }

  public async create(user_id: string, params: dto.CreateClientDto) {
    const redirectUrisOrigins = params.redirect_uris?.map((uri) => {
      return new URL(uri).origin;
    });

    const provider = await prisma.provider.findFirst({
      where: { type: 'CREDENTIALS' },
      select: { id: true },
    });

    if (!provider) {
      throw new InternalServerErrorException(Ei18nCodes.T3E0030, { cause: 'CREDENTIALS' });
    }

    let type: Prisma.ClientTypeCreateNestedOneWithoutClientsInput | undefined;
    if (params.type_id) {
      const clientType = await prisma.clientType.findUnique({
        where: { id: params.type_id },
      });

      if (clientType) {
        type = {
          connect: {
            id: params.type_id,
          },
        };
      }
    }

    const parent = params.parent_id
      ? await prisma.client.findFirst({
          where: {
            client_id: params.parent_id,
            OR: [{ client_id: CLIENT_ID }, { parent_id: null }],
          },
          select: { client_id: true },
        })
      : await prisma.role.findFirst({
          where: {
            user_id,
            role: { in: [UserRoles.OWNER, UserRoles.EDITOR] },
            client: { parent: null },
          },
          select: { client_id: true },
        });

    if (!parent) throw new InternalServerErrorException(Ei18nCodes.T3E0071);

    // Find or create the root directory folder for the parent client.
    let directoryFolder = await prisma.folder.findFirst({
      where: {
        client_id: parent.client_id,
        name: 'Directory',
        parent_id: null,
      },
    });

    if (!directoryFolder) {
      directoryFolder = await prisma.folder.create({
        data: {
          client_id: parent.client_id,
          name: 'Directory',
          description: 'System directory folder',
        },
      });
    }

    const data: Prisma.ClientCreateInput = {
      client_id: generateRandomString(22),
      client_secret: generateRandomString(87),

      name: normalizeClientNameInput(params.name),
      catalog_name: normalizeClientNameInput(params.catalog_name),
      domain: params.domain,

      folder: {
        connect: { id: directoryFolder.id },
      },

      parent: {
        connect: {
          client_id: parent.client_id,
        },
      },

      description: params.description,
      response_types: params.response_types,
      request_uris: params.request_uris,
      token_endpoint_auth_method: params.token_endpoint_auth_method,
      introspection_endpoint_auth_method: params.introspection_endpoint_auth_method,
      revocation_endpoint_auth_method: params.revocation_endpoint_auth_method,
      id_token_signed_response_alg: params.id_token_signed_response_alg,
      subject_type: params.subject_type,
      catalog: params.catalog,
      authorize_only_admins: params.authorize_only_admins,
      authorize_only_employees: params.authorize_only_employees,
      authorize_auto_by_session: params.authorize_auto_by_session,

      redirect_uris: params.redirect_uris,
      grant_types: params.grant_types || ['authorization_code', 'refresh_token'],
      post_logout_redirect_uris: params.post_logout_redirect_uris?.length
        ? params.post_logout_redirect_uris
        : redirectUrisOrigins,
      require_auth_time: params.require_auth_time,
      require_signed_request_object: params.require_signed_request_object,

      widget_colors: {
        button_color: '#4C6AD4',
        font_color: '#fff',
        link_color: '#000',
      },
      roles: {
        create: {
          user_id,
          role: UserRoles.OWNER,
        },
      },
      providerRelations: {
        create: {
          provider_id: provider.id,
        },
      },
      type,
    };

    const client = await prisma.client.create({ data });
    await this.refreshWhiteListRuntime();

    return {
      client_id: client.client_id,
      client_secret: client.client_secret,
    };
  }

  async getClientsByUserId(
    user_id: string,
    {
      search_string,
      sort_by,
      sort_direction,
      number_of_records,
      last_record_id,
      number_of_skip,
    }: dto.GetClientsByUserIdDto,
  ) {
    try {
      const where: Prisma.RoleWhereInput = {
        user_id,
        client: search_string
          ? {
              OR: [
                { client_id: { contains: search_string, mode: 'insensitive' } },
                ...buildClientNameSearchConditions(search_string),
                { domain: { contains: search_string, mode: 'insensitive' } },
              ],
            }
          : undefined,
        role: { in: [UserRoles.EDITOR, UserRoles.OWNER] },
      };

      if (sort_by === dto.ClientFilterFields.name) {
        const sortContext = await getLocalizedClientSortContext();
        const roles = await prisma.role.findMany({
          where,
          select: {
            role: true,
            client: true,
          },
        });
        const sortedRoles = sortItemsByLocalizedClientName(roles, {
          sortDirection: sort_direction || SortDirection.ASC,
          sortContext,
          getClientName: (item) => item.client.name,
          getClientId: (item) => item.client.client_id,
        });

        return sliceItemsByCursor(sortedRoles, {
          number_of_records,
          number_of_skip,
          last_record_id,
          getClientId: (item) => item.client.client_id,
        });
      }

      const clients = await prisma.role.findMany({
        take: parseInt(number_of_records, 10) || undefined,
        skip: last_record_id ? 1 : undefined,
        cursor: last_record_id
          ? {
              user_id_client_id: {
                user_id,
                client_id: last_record_id,
              },
            }
          : undefined,
        where,
        select: {
          role: true,
          client: true,
        },
        orderBy: sort_by ? { client: { [sort_by]: sort_direction } } : undefined,
      });
      return clients.reduce((acc, item) => {
        acc.push(item);
        return acc;
      }, []);
    } catch (e) {
      throw new InternalServerErrorException(Ei18nCodes.T3E0078, {
        cause: e,
      });
    }
  }

  /**
   * Getting a list of apps according to filters
   */
  public async list(params: ListInputDto, user_id: string, role: UserRoles) {
    const { filter, limit, sortBy, sortDirection, offset, search } = params;
    const searchValue = search?.trim();
    const rawFilter = (filter || {}) as Record<string, any>;
    const { admin_list: _adminList, parent_id: requestedParentId, ...cleanFilter } = rawFilter;
    const isSystemAdmin = role === UserRoles.OWNER || role === UserRoles.EDITOR;
    const isAdminList = requestedParentId === CLIENT_ID && !isSystemAdmin;
    const shouldRestrictByRoles = isAdminList || !isSystemAdmin;
    const isOrganizationScopedList =
      typeof requestedParentId === 'string' &&
      requestedParentId.length > 0 &&
      requestedParentId !== CLIENT_ID;
    const parentIdFilter =
      requestedParentId !== undefined && !isAdminList
        ? { parent_id: requestedParentId }
        : { parent_id: { not: null } };

    const accessWhere: Prisma.ClientWhereInput | undefined = isAdminList
      ? {
          roles: {
            some: {
              user_id,
              role: UserRoles.EDITOR,
              client: {
                parent_id: {
                  not: null,
                },
              },
            },
          },
          NOT: {
            parent: {
              is: {
                roles: {
                  some: {
                    user_id,
                    role: { in: [UserRoles.OWNER, UserRoles.EDITOR] },
                  },
                },
              },
            },
          },
        }
      : shouldRestrictByRoles
      ? {
          OR: [
            {
              roles: {
                some: {
                  user_id,
                  client_id: { not: CLIENT_ID },
                  role: { in: [UserRoles.OWNER, UserRoles.EDITOR] },
                },
              },
            },
            ...(isOrganizationScopedList
              ? [
                  {
                    parent: {
                      is: {
                        roles: {
                          some: {
                            user_id,
                            role: { in: [UserRoles.OWNER, UserRoles.EDITOR] },
                          },
                        },
                      },
                    },
                  } satisfies Prisma.ClientWhereInput,
                ]
              : []),
          ],
        }
      : undefined;

    const searchWhere: Prisma.ClientWhereInput | undefined = searchValue
      ? {
          OR: [
            { client_id: { contains: searchValue, mode: 'insensitive' } },
            ...buildClientNameSearchConditions(searchValue),
            ...buildLocalizedClientFieldSearchConditions('catalog_name', searchValue),
            { description: { contains: searchValue, mode: 'insensitive' } },
            { domain: { contains: searchValue, mode: 'insensitive' } },
          ],
        }
      : undefined;

    const findParams: Prisma.ClientFindManyArgs<DefaultArgs> = {
      where: {
        ...cleanFilter,
        ...parentIdFilter,
        ...((accessWhere || searchWhere) && {
          AND: [accessWhere, searchWhere].filter(Boolean) as Prisma.ClientWhereInput[],
        }),
      },
      select: {
        client_id: true,
        name: true,
        catalog_name: true,
        catalog: true,
        description: true,
        domain: true,
        avatar: true,
        created_at: true,
        type: true,
        parent: {
          select: {
            avatar: true,
            name: true,
          },
        },
        providerRelations: {
          select: {
            provider: {
              select: {
                id: true,
                type: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            roles: true,
          },
        },
        roles: {
          where: {
            role: UserRoles.OWNER,
          },
          select: {
            user: {
              include: legacyUserInclude,
            },
          },
        },
      },
    };

    let clients;
    let totalCount: number;

    if (sortBy === dto.ClientFilterFields.name) {
      const sortContext = await getLocalizedClientSortContext();
      const matchedClients = await prisma.client.findMany(findParams);
      const sortedClients = sortItemsByLocalizedClientName(matchedClients, {
        sortDirection: sortDirection || SortDirection.ASC,
        sortContext,
        getClientName: (client) => client.name,
        getClientId: (client) => client.client_id,
      });

      clients = sliceItemsByOffset(sortedClients, limit, offset);
      totalCount = sortedClients.length;
    } else {
      [clients, totalCount] = await Promise.all([
        prisma.client.findMany({
          ...findParams,
          take: limit,
          skip: offset,
          orderBy: sortBy ? { [sortBy]: sortDirection } : undefined,
        }),
        prisma.client.count({ where: findParams.where }),
      ]);
    }

    const activity30dByClientId = await getClientActivity30d(
      clients.map((client) => client.client_id),
    );

    return {
      clients: clients.map((client) => {
        const ownerRole = (client as any).roles?.[0]?.user
          ? toLegacyUser((client as any).roles[0].user)
          : null;

        const { providerRelations, roles: _roles, _count, ...rest } = client as any;

        return {
          ...rest,
          Provider_relations: providerRelations,
          _count: {
            Role: _count.roles,
          },
          owner: toClientOwnerSummary(ownerRole),
          activity_30d: activity30dByClientId.get(client.client_id) || 0,
        };
      }),
      totalCount,
    };
  }

  /**
   * Getting a list of public apps according to filters
   */
  public async catalog(params: ListInputDto, user_id: string) {
    const { filter, limit, sortBy, sortDirection, offset, search } = params;
    const searchValue = search?.trim();

    const findParams: Prisma.ClientFindManyArgs<DefaultArgs> = {
      where: {
        ...filter,
        catalog: true,
        parent_id: { not: null },
        OR: searchValue
          ? [
              ...buildClientNameSearchConditions(searchValue),
              ...buildLocalizedClientFieldSearchConditions('catalog_name', searchValue),
              { description: { contains: searchValue, mode: 'insensitive' } },
            ]
          : undefined,
      },
      select: {
        client_id: true,
        name: true,
        catalog_name: true,
        description: true,
        domain: true,
        avatar: true,
        created_at: true,
        type: true,
        favorite_clients: {
          where: {
            user_id,
          },
          select: {
            id: true,
          },
        },
      },
    };

    let clients;
    let totalCount: number;

    if (sortBy === dto.ClientFilterFields.name) {
      const sortContext = await getLocalizedClientSortContext();
      const matchedClients = await prisma.client.findMany(findParams);
      const sortedClients = sortItemsByLocalizedClientName(matchedClients, {
        sortDirection: sortDirection || SortDirection.ASC,
        sortContext,
        getClientName: (client) => getClientCatalogDisplayName(client),
        getClientId: (client) => client.client_id,
      });

      clients = sliceItemsByOffset(sortedClients, limit, offset);
      totalCount = sortedClients.length;
    } else {
      [clients, totalCount] = await Promise.all([
        prisma.client.findMany({
          ...findParams,
          take: limit,
          skip: offset,
          orderBy: sortBy ? { [sortBy]: sortDirection } : undefined,
        }),
        prisma.client.count({ where: findParams.where }),
      ]);
    }

    return {
      clients: clients.map((client) => ({
        ...client,
        favorite: client['favorite_clients'].length > 0,
      })),
      totalCount,
    };
  }

  /**
   * Getting an app by client_id
   */
  public async getById(client_id: string) {
    const client = await prisma.client.findUnique({
      where: {
        client_id,
      },
      include: {
        type: true,
        parent: {
          select: {
            avatar: true,
            name: true,
          },
        },
        required_profile_fields: {
          include: {
            profile_field: {
              include: {
                validations: {
                  include: {
                    rule_validation: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!client) {
      return client;
    }

    return {
      ...client,
      rules:
        client.required_profile_fields?.map(({ profile_field }) =>
          this.mapClientRule(profile_field),
        ) ?? [],
    };
  }

  public async getByIdShort(client_id: string) {
    return prisma.client.findUnique({
      where: {
        client_id,
      },
      select: {
        client_id: true,
        name: true,
        description: true,
        domain: true,
        avatar: true,
        created_at: true,
        type: true,
      },
    });
  }

  async getAllClients({
    search_string,
    sort_by,
    sort_direction,
    number_of_records,
    last_record_id,
    number_of_skip,
  }: dto.GetAllClientsDto) {
    try {
      const where: Prisma.ClientWhereInput = search_string
        ? {
            OR: [
              { client_id: { contains: search_string, mode: 'insensitive' } },
              ...buildClientNameSearchConditions(search_string),
              { domain: { contains: search_string, mode: 'insensitive' } },
            ],
          }
        : undefined;

      if (sort_by === dto.ClientFilterFields.name) {
        const sortContext = await getLocalizedClientSortContext();
        const clients = await prisma.client.findMany({ where });
        const sortedClients = sortItemsByLocalizedClientName(clients, {
          sortDirection: sort_direction || SortDirection.ASC,
          sortContext,
          getClientName: (client) => client.name,
          getClientId: (client) => client.client_id,
        });

        return sliceItemsByCursor(sortedClients, {
          number_of_records,
          number_of_skip,
          last_record_id,
          getClientId: (client) => client.client_id,
        }).map((client) => ({ client, role: UserRoles.OWNER }));
      }

      const clients = await prisma.client.findMany({
        take: parseInt(number_of_records, 10) || undefined,
        skip: last_record_id ? 1 : undefined,
        cursor: last_record_id
          ? {
              client_id: last_record_id,
            }
          : undefined,
        where,
        orderBy: [{ [sort_by]: sort_direction }, { client_id: SortDirection.ASC }],
      });
      return clients.map((client) => ({ client, role: UserRoles.OWNER }));
    } catch (e) {
      throw new InternalServerErrorException(Ei18nCodes.T3E0078, { cause: e });
    }
  }

  async getScopesByClientId(client_id: string, user_id: string) {
    return prisma.scopes.findUnique({
      where: {
        user_id_client_id: { user_id, client_id },
      },
      select: {
        scopes: true,
        created_at: true,
      },
    });
  }

  async getClientByScope(user_id, client_id) {
    const data = await prisma.scopes.findUnique({
      where: {
        user_id_client_id: {
          user_id,
          client_id,
        },
      },
      select: {
        client: {
          select: {
            name: true,
            avatar: true,
            client_id: true,
            description: true,
            domain: true,
            created_at: true,
            type: true,
          },
        },
      },
    });

    return data;
  }

  async getClientsByScope(
    user_id,
    {
      search_string,
      sort_by,
      sort_direction,
      number_of_records,
      last_record_id,
    }: dto.GetClientsByScopeDto,
  ) {
    try {
      const where: Prisma.ScopesWhereInput = {
        user_id,
        client: {
          AND: {
            NOT: { client_id: user_id === '1' ? undefined : CLIENT_ID },
            OR: search_string
              ? [
                  { client_id: { contains: search_string, mode: 'insensitive' } },
                  ...buildClientNameSearchConditions(search_string),
                  { domain: { contains: search_string, mode: 'insensitive' } },
                ]
              : undefined,
          },
        },
      };
      const select = {
        client: {
          select: {
            name: true,
            avatar: true,
            client_id: true,
            description: true,
            domain: true,
            created_at: true,
            type: true,
          },
        },
      } satisfies Prisma.ScopesSelect;

      if (sort_by === dto.ClientFilterFields.name) {
        const sortContext = await getLocalizedClientSortContext();
        const data = await prisma.scopes.findMany({
          where,
          select,
        });
        const sortedData = sortItemsByLocalizedClientName(data, {
          sortDirection: sort_direction || SortDirection.ASC,
          sortContext,
          getClientName: (item) => item.client.name,
          getClientId: (item) => item.client.client_id,
        });

        return sliceItemsByCursor(sortedData, {
          number_of_records,
          last_record_id,
          getClientId: (item) => item.client.client_id,
        });
      }

      const data = await prisma.scopes.findMany({
        take: parseInt(number_of_records, 10) || undefined,
        skip: last_record_id ? 1 : undefined,
        cursor: last_record_id
          ? {
              user_id_client_id: {
                user_id,
                client_id: last_record_id,
              },
            }
          : undefined,
        where,
        select,
        orderBy: sort_by ? { client: { [sort_by]: sort_direction } } : undefined,
      });

      return data;
    } catch (e) {
      throw new InternalServerErrorException(Ei18nCodes.T3E0078, { cause: e });
    }
  }

  async revokeScopes(user_id: string, client_id: string) {
    try {
      await this.redis.revokeGrants(user_id, client_id);

      return await prisma.scopes.delete({
        where: {
          user_id_client_id: {
            user_id,
            client_id,
          },
        },
      });
    } catch (e) {
      throw new InternalServerErrorException(Ei18nCodes.T3E0078, {
        cause: e,
      });
    }
  }

  async getAppAdmins(client_id: string) {
    try {
      return await prisma.role.findMany({
        where: { client_id, role: UserRoles.EDITOR },
        select: { user: true },
      });
    } catch (e) {
      throw new InternalServerErrorException(Ei18nCodes.T3E0078, { cause: e });
    }
  }

  async getAllAppUsers(client_id: string) {
    try {
      return await prisma.role.findMany({
        where: { client_id, user: { deleted: null } },
        select: { user: true },
      });
    } catch (e) {
      throw new InternalServerErrorException(Ei18nCodes.T3E0078, { cause: e });
    }
  }

  public async listUsers(params: ListInputDto, client_id: string, actorUserId?: string) {
    const roleFilter = typeof params.filter?.role === 'string' ? params.filter.role : undefined;
    const accessContext = actorUserId
      ? await buildManagedUserAccessContext(actorUserId)
      : undefined;

    if (this.hasUnsupportedUserListFilter(params.filter)) {
      return this.listUsersInMemoryWithContext(params, client_id, accessContext);
    }

    if (accessContext && !accessContext.isSystemManager) {
      return this.listUsersInMemoryWithContext(params, client_id, accessContext);
    }

    return this.listUsersOptimized(params, client_id, roleFilter);
  }

  async createUser(client_id: string, createUserDto: CreateUserDTO, actorUserId?: string) {
    const { send_account_create_email: sendAccountCreateEmail = false, ...createUserPayload } =
      createUserDto;
    const organizationId = await getOrganizationId(client_id);
    await this.assertCanManageOrganizationUsers(actorUserId, organizationId);
    const organization = await prisma.client.findUnique({
      where: { client_id: organizationId },
      select: {
        folder_id: true,
      },
    });

    if (!organization?.folder_id) {
      throw new NotFoundException('Directory folder not found for organization');
    }

    const createdUser = await this.userService.create({
      ...createUserPayload,
      org_id: organizationId,
      folder_id: organization.folder_id,
    });

    const user = await this.userService.userRepo.findById(createdUser.id);

    const confirmedEmail = getLegacyUserPrimaryExternalAccountEmail(user);

    if (sendAccountCreateEmail && confirmedEmail && createUserPayload.password) {
      try {
        await this.mailService.sendMail(confirmedEmail, {
          action: NotificationAction.account_create,
          password: createUserPayload.password,
          user_id: user.id,
          branding_client_id: organizationId,
        });
      } catch (e) {
        const error = e as Error;
        this.logger.warn({ description: error.message }, 'WARNING');
      }
    }

    return { id: createdUser.id, nickname: createdUser.nickname };
  }

  async blockUser(user_id: string, client_id: string, actorUserId?: string) {
    const organizationId = await getOrganizationId(client_id);
    await this.assertCanManageOrganizationUsers(actorUserId, organizationId);

    const canManageUser = actorUserId
      ? await canManageTargetUser(actorUserId, user_id, this.roleRepo)
      : true;
    if (!canManageUser) {
      throw new ForbiddenException('Insufficient access rights');
    }

    await prisma.role.update({
      where: {
        user_id_client_id: {
          user_id,
          client_id,
        },
      },
      data: {
        blocked: true,
      },
    });
  }

  async unblockUser(user_id: string, client_id: string, actorUserId?: string) {
    const organizationId = await getOrganizationId(client_id);
    await this.assertCanManageOrganizationUsers(actorUserId, organizationId);

    const canManageUser = actorUserId
      ? await canManageTargetUser(actorUserId, user_id, this.roleRepo)
      : true;
    if (!canManageUser) {
      throw new ForbiddenException('Insufficient access rights');
    }

    await prisma.role.update({
      where: {
        user_id_client_id: {
          user_id,
          client_id,
        },
      },
      data: {
        blocked: false,
      },
    });
  }

  async addUserToInternalList(user_id: string, client_id: string, actorUserId?: string) {
    if (client_id !== CLIENT_ID) {
      throw new BadRequestException('Adding to the internal list is only available in the system');
    }

    await this.assertCanManageOrganizationUsers(actorUserId, CLIENT_ID);

    return prisma.$transaction(async (tx) => {
      const [user, systemRole, systemFolderId] = await Promise.all([
        tx.user.findUnique({
          where: { id: user_id },
          select: {
            id: true,
            org_id: true,
          },
        }),
        tx.role.findUnique({
          where: {
            user_id_client_id: {
              user_id,
              client_id: CLIENT_ID,
            },
          },
          select: {
            role: true,
          },
        }),
        this.resolveClientFolderId(tx, CLIENT_ID),
      ]);

      if (!user || !systemRole) {
        throw new NotFoundException('User not found');
      }

      if (systemRole.role !== UserRoles.USER) {
        throw new BadRequestException('Only participants can be added to the internal list');
      }

      if (user.org_id !== null) {
        throw new BadRequestException('Only external users can be added to the internal list');
      }

      await tx.user.update({
        where: { id: user_id },
        data: {
          org_id: CLIENT_ID,
          folder_id: systemFolderId,
        },
      });

      await syncGuestsMembershipForUser(tx, user_id, CLIENT_ID);
    });
  }

  async removeUserFromInternalList(user_id: string, client_id: string, actorUserId?: string) {
    if (client_id !== CLIENT_ID) {
      throw new BadRequestException(
        'Removing from the internal list is only available in the system',
      );
    }

    await this.assertCanManageOrganizationUsers(actorUserId, CLIENT_ID);

    return prisma.$transaction(async (tx) => {
      const [user, systemRole, systemFolderId] = await Promise.all([
        tx.user.findUnique({
          where: { id: user_id },
          select: {
            id: true,
            org_id: true,
          },
        }),
        tx.role.findUnique({
          where: {
            user_id_client_id: {
              user_id,
              client_id: CLIENT_ID,
            },
          },
          select: {
            role: true,
          },
        }),
        this.resolveClientFolderId(tx, CLIENT_ID),
      ]);

      if (!user || !systemRole) {
        throw new NotFoundException('User not found');
      }

      if (
        systemRole.role === UserRoles.OWNER ||
        systemRole.role === UserRoles.MANAGER ||
        systemRole.role === UserRoles.EDITOR
      ) {
        throw new BadRequestException('Managers cannot be removed from the internal list');
      }

      if (user.org_id !== CLIENT_ID) {
        throw new BadRequestException('Only internal users can be removed from the internal list');
      }

      await tx.user.update({
        where: { id: user_id },
        data: {
          org_id: null,
          folder_id: systemFolderId,
        },
      });

      await this.clearTrustedMembershipData(tx, user_id);
      await syncGuestsMembershipForUser(tx, user_id, CLIENT_ID);
    });
  }

  async removeUserFromOrganizationList(user_id: string, client_id: string, actorUserId?: string) {
    const organizationId = await getOrganizationId(client_id);

    if (organizationId === CLIENT_ID) {
      throw new BadRequestException('Use the system internal-list actions for the base client');
    }

    await this.assertCanManageOrganizationUsers(actorUserId, organizationId);

    return prisma.$transaction(async (tx) => {
      const [user, organizationRole, organizationClientIds, systemFolderId] = await Promise.all([
        tx.user.findUnique({
          where: { id: user_id },
          select: {
            id: true,
            org_id: true,
          },
        }),
        tx.role.findUnique({
          where: {
            user_id_client_id: {
              user_id,
              client_id: organizationId,
            },
          },
          select: {
            role: true,
          },
        }),
        this.getOrganizationClientIds(tx, organizationId),
        this.resolveClientFolderId(tx, CLIENT_ID),
      ]);

      if (!user || !organizationRole) {
        throw new NotFoundException('User not found in organization');
      }

      if (
        organizationRole.role === UserRoles.OWNER ||
        organizationRole.role === UserRoles.MANAGER ||
        organizationRole.role === UserRoles.EDITOR
      ) {
        throw new BadRequestException('Managers cannot be removed from the organization list');
      }

      if (user.org_id && user.org_id !== organizationId) {
        throw new BadRequestException(
          'The user belongs to another organization and cannot be removed by this action',
        );
      }

      await Promise.all([
        tx.role.deleteMany({
          where: {
            user_id,
            client_id: {
              in: organizationClientIds,
            },
          },
        }),
        tx.scopes.deleteMany({
          where: {
            user_id,
            client_id: {
              in: organizationClientIds,
            },
          },
        }),
        tx.rbacGroupMember.deleteMany({
          where: {
            member_user_id: user_id,
            parent_group: {
              client_id: {
                in: organizationClientIds,
              },
            },
          },
        }),
        tx.rbacAssignment.deleteMany({
          where: {
            user_id,
            resource: {
              client_id: {
                in: organizationClientIds,
              },
            },
          },
        }),
      ]);

      await tx.user.update({
        where: { id: user_id },
        data: {
          org_id: null,
          folder_id: systemFolderId,
        },
      });

      await this.clearTrustedMembershipData(tx, user_id);
      await syncGuestsMembershipForUser(tx, user_id, CLIENT_ID);
      await this.addUserToOrganizationGuestsGroup(tx, user_id, organizationId);
      await syncOrganizationGuestsMembershipForUser(tx, user_id, organizationId);
    });
  }

  async getUserById(userId: string, user_id: string, client_id: string) {
    const client = await prisma.client.findUnique({
      where: { client_id },
      select: {
        client_id: true,
        parent_id: true,
      },
    });

    if (!client) {
      throw new BadRequestException(Ei18nCodes.T3E0071);
    }

    if (client.client_id !== CLIENT_ID && client.parent_id === null) {
      const data = await prisma.user.findUnique({
        where: { id: user_id },
        include: legacyUserInclude,
      });

      if (!data) {
        return null;
      }

      const user = withLegacyUserBlocked(toLegacyUser(data), client_id);
      const organizationRole =
        user?.Role?.find((role) => role.client_id === client_id)?.role || UserRoles.USER;
      const canManageUser = user
        ? await canManageTargetUser(userId, user.id, this.roleRepo)
        : false;

      if (user && canManageUser) {
        return {
          user: toUserProfileResponse(await this.filterUserProfileForClient(user, client_id)),
          role: organizationRole,
        };
      }

      if (user) {
        return {
          user: toPublicLegacyUser(await this.filterUserProfileForClient(user, client_id)),
          role: organizationRole,
        };
      }

      return null;
    }

    const data = await prisma.role.findUnique({
      where: {
        user_id_client_id: {
          client_id,
          user_id,
        },
      },
      include: {
        user: {
          include: legacyUserInclude,
        },
      },
    });

    if (!data) {
      return null;
    }

    const user = withLegacyUserBlocked(toLegacyUser(data.user), client_id);
    const canManageUser = user ? await canManageTargetUser(userId, user.id, this.roleRepo) : false;

    if (user && !canManageUser) {
      return {
        user: toPublicLegacyUser(await this.filterUserProfileForClient(user, client_id)),
        role: data.role,
      };
    }

    return {
      user: toUserProfileResponse(await this.filterUserProfileForClient(user, client_id)),
      role: data.role,
    };
  }

  async update(params: dto.UpdateClientDto, client_id: string) {
    let data: any = {};
    const client = await prisma.client.findUnique({ where: { client_id } });

    if (client_id === CLIENT_ID) {
      for (const key of Object.keys(params)) {
        if (CLIENT_FIELDS_NOT_EDITABLE.includes(key)) {
          throw new BadRequestException(Ei18nCodes.T3E0067, { cause: key });
        }
      }
    }

    data = {
      client_id,
      ...params,
    };
    const normalizedName = normalizeClientNameInput(data.name);
    if (normalizedName !== undefined) {
      data.name = normalizedName;
    } else {
      delete data.name;
    }

    const normalizedCatalogName = normalizeClientNameInput(data.catalog_name);
    if (normalizedCatalogName !== undefined) {
      data.catalog_name = normalizedCatalogName;
    } else {
      delete data.catalog_name;
    }

    // Remove the application from the favorites list if it has become non-public
    if (params.catalog === false) {
      await prisma.favoriteClients.deleteMany({
        where: { client_id },
      });
    }

    // Update the application type
    if (params.type_id) {
      data.type = {
        connect: {
          id: params.type_id,
        },
      };
    } else if (params.type_id === null || params.type_id === '') {
      data.type = {
        disconnect: true,
      };
    }
    delete data['type_id'];

    if (data.avatar && client?.avatar !== data.avatar) {
      await deleteImageFromLocalPath(client.avatar);
    }
    if (data.cover && client?.cover !== data.cover) {
      await deleteImageFromLocalPath(client.cover);
    }

    const updatedClient = await prisma.client.update({
      where: { client_id },
      data,
    });
    await this.refreshWhiteListRuntime();

    return updatedClient;
  }

  async regenerateClientSecret(client_id: string) {
    if (client_id === CLIENT_ID) {
      throw new BadRequestException(Ei18nCodes.T3E0067);
    }

    await this.redis.revokeTokensByClientId(client_id);

    return prisma.client.update({
      where: { client_id },
      data: {
        client_secret: generateRandomString(87),
      },
      select: {
        client_id: true,
        client_secret: true,
      },
    });
  }

  /**
   * Deleting an app
   * Only the app owner or account owner can delete an app
   */
  async delete(client_id: string) {
    if (client_id === CLIENT_ID) {
      throw new BadRequestException(Ei18nCodes.T3E0067);
    }

    const avatar = await prisma.client.findUnique({
      where: { client_id },
      select: { avatar: true, cover: true },
    });
    if (avatar?.avatar) await deleteImageFromLocalPath(avatar.avatar);
    if (avatar?.cover) await deleteImageFromLocalPath(avatar.cover);

    // Remove the application from the database
    await prisma.client.deleteMany({
      where: {
        client_id,
      },
    });

    await this.refreshWhiteListRuntime();
  }

  async createOrganization(user_id: string): Promise<{ orgId: string }> {
    const ownedOrganizationsCount = await this.countOwnedOrganizations(user_id);
    if (ownedOrganizationsCount >= MAX_OWNED_ORGANIZATIONS) {
      throw new BadRequestException(Ei18nCodes.T3E0104, {
        cause: { limit: MAX_OWNED_ORGANIZATIONS },
      });
    }

    const orgId = await this.createOrgClient(user_id);

    await this.refreshWhiteListRuntime();

    await this.callEventsService.call(CallEventNames.Organization.afterCreated, {
      orgId,
      actorUserId: user_id,
    } satisfies OrganizationAfterCreatedPayload);

    return { orgId };
  }

  async transferOwner(client_id: string, user_id: string, actorUserId?: string) {
    if (client_id === CLIENT_ID) {
      throw new BadRequestException(Ei18nCodes.T3E0067);
    }

    const organizationId = await getOrganizationId(client_id);
    const [client, targetUser, ownerRoles, targetOrganizationRole] = await Promise.all([
      prisma.client.findUnique({
        where: { client_id },
        select: {
          client_id: true,
          parent_id: true,
        },
      }),
      prisma.user.findUnique({
        where: { id: user_id },
        select: {
          id: true,
        },
      }),
      prisma.role.findMany({
        where: {
          client_id,
          role: UserRoles.OWNER,
        },
        select: {
          user_id: true,
        },
      }),
      prisma.role.findUnique({
        where: {
          user_id_client_id: {
            user_id,
            client_id: organizationId,
          },
        },
        select: {
          role: true,
        },
      }),
    ]);

    if (!client || !targetUser || !ownerRoles.length) {
      throw new NotFoundException(Ei18nCodes.T3E0003);
    }

    if (client.parent_id === null) {
      await this.assertCanTransferOrganizationOwner(actorUserId, organizationId);
    } else {
      await this.assertCanManageOrganizationUsers(actorUserId, organizationId);
    }

    if (!targetOrganizationRole) {
      throw new BadRequestException(
        'The new organization owner must have a role in the organization',
      );
    }

    if (ownerRoles.some((role) => role.user_id === user_id)) {
      return;
    }

    const targetUserOwnedOrganizationsCount = await this.countOwnedOrganizations(user_id);
    if (targetUserOwnedOrganizationsCount >= MAX_OWNED_ORGANIZATIONS) {
      throw new BadRequestException(Ei18nCodes.T3E0104, {
        cause: { limit: MAX_OWNED_ORGANIZATIONS },
      });
    }

    return prisma.$transaction(async (tx) => {
      await tx.role.updateMany({
        where: {
          client_id,
          role: UserRoles.OWNER,
          user_id: {
            not: user_id,
          },
        },
        data: {
          role: UserRoles.EDITOR,
        },
      });

      await tx.role.upsert({
        where: {
          user_id_client_id: {
            user_id,
            client_id,
          },
        },
        update: {
          role: UserRoles.OWNER,
        },
        create: {
          user_id,
          client_id,
          role: UserRoles.OWNER,
        },
      });
    });
  }

  async deleteSessionsByClient(user_id: string, client_id: string, cookie) {
    try {
      await this.redis.revokeAllTokensByUserAndClientId(user_id, client_id, cookie);
    } catch (e) {
      throw new InternalServerErrorException(Ei18nCodes.T3E0078, { cause: e });
    }
  }

  async findClientByCredentials(client_id: string, client_secret: string) {
    return await prisma.client.findUnique({ where: { client_id, client_secret } });
  }

  async getApplicationsCount(user_id, { search_string }: dto.GetApplicationsCountDto) {
    try {
      return await prisma.role.count({
        where: {
          user_id,
          client: search_string
            ? {
                OR: [
                  { client_id: { contains: search_string, mode: 'insensitive' } },
                  ...buildClientNameSearchConditions(search_string),
                  { domain: { contains: search_string, mode: 'insensitive' } },
                ],
              }
            : undefined,
          role: { in: [UserRoles.EDITOR, UserRoles.OWNER] },
        },
      });
    } catch (e) {
      throw new InternalServerErrorException(Ei18nCodes.T3E0078, { cause: e });
    }
  }

  /**
   * Getting the number of a user's apps that have been granted permissions
   */
  async getClientsCountByScope(
    user_id: string,
    { search_string }: dto.GetApplicationsCountDto,
  ): Promise<number> {
    return prisma.scopes.count({
      where: {
        user_id,
        client: {
          AND: {
            NOT: { client_id: user_id === '1' ? undefined : CLIENT_ID },
            OR: search_string
              ? [
                  { client_id: { contains: search_string, mode: 'insensitive' } },
                  ...buildClientNameSearchConditions(search_string),
                  { domain: { contains: search_string, mode: 'insensitive' } },
                ]
              : undefined,
          },
        },
      },
    });
  }

  async addRule(client_id: string, rule_id: string) {
    if (client_id === CLIENT_ID) {
      throw new BadRequestException(Ei18nCodes.T3E0026);
    }

    const isExist = await prisma.clientRequiredProfileField.findFirst({
      where: { client_id, profile_field_id: rule_id },
    });
    if (isExist) return;

    await prisma.client.update({
      where: { client_id },
      data: {
        required_profile_fields: {
          create: { profile_field_id: rule_id },
        },
      },
    });
  }

  async deleteRule(client_id: string, rule_id: string) {
    if (client_id === CLIENT_ID) {
      throw new BadRequestException(Ei18nCodes.T3E0026);
    }

    return prisma.client.update({
      where: { client_id },
      data: {
        required_profile_fields: {
          deleteMany: { client_id, profile_field_id: rule_id },
        },
      },
    });
  }

  private buildWhiteListPayload(
    clients: Array<{
      client_id: string;
      domain: string | null;
    }>,
    systemClientId: string,
  ): ClientWhiteListPayload {
    const origins = Array.from(
      new Set(
        clients
          .map((client) => {
            if (!client.domain) {
              return null;
            }

            try {
              return new URL(client.domain).origin;
            } catch {
              return null;
            }
          })
          .filter(Boolean) as string[],
      ),
    );

    return {
      origins,
      system_client_id: systemClientId,
    };
  }

  private async loadWhiteListFromDatabase(): Promise<ClientWhiteListPayload> {
    const findParams: Prisma.ClientFindManyArgs<DefaultArgs> = {
      orderBy: [{ created_at: 'asc' }, { client_id: 'asc' }],
      select: {
        client_id: true,
        domain: true,
      },
    };

    const clients = await prisma.client.findMany(findParams);
    const systemClientId = clients[0]?.client_id || '';

    if (systemClientId && systemClientId !== CLIENT_ID) {
      setClientId(systemClientId);
    }

    return this.buildWhiteListPayload(clients, systemClientId);
  }

  private async cacheWhiteList(payload: ClientWhiteListPayload): Promise<void> {
    await this.whiteListCache.upsert(WHITE_LIST_CACHE_KEY, payload);
  }

  private async publishWhiteList(payload: ClientWhiteListPayload): Promise<void> {
    await this.whiteListPublisher.publish(WHITE_LIST_REDIS_CHANNEL, JSON.stringify(payload));
  }

  private async refreshWhiteListRuntime(): Promise<ClientWhiteListPayload> {
    const payload = await this.loadWhiteListFromDatabase();

    await Promise.all([
      this.cacheWhiteList(payload).catch((error) => {
        console.error('Failed to cache white-list in Redis:', error);
      }),
      this.publishWhiteList(payload).catch((error) => {
        console.error('Failed to publish white-list update:', error);
      }),
    ]);

    return payload;
  }

  public async getWhiteList(forceRefresh = false): Promise<ClientWhiteListPayload> {
    if (!forceRefresh) {
      try {
        const cached = await this.whiteListCache.get<ClientWhiteListPayload>(WHITE_LIST_CACHE_KEY);
        if (cached?.system_client_id && Array.isArray(cached.origins)) {
          const cachedSystemClient = await prisma.client.findUnique({
            where: { client_id: cached.system_client_id },
            select: { client_id: true },
          });

          if (cachedSystemClient?.client_id) {
            return cached;
          }
        }
      } catch (error) {
        console.error('Failed to read white-list from Redis:', error);
      }
    }

    return this.refreshWhiteListRuntime();
  }

  /**
   * Updating an avatar
   */
  async updateAvatar(params: dto.UpdateAvatarClientDto, client_id: string) {
    const client = await prisma.client.findUnique({ where: { client_id } });
    const avatarChanged = params.avatar !== undefined && client?.avatar !== params.avatar;
    const coverChanged = params.cover !== undefined && client?.cover !== params.cover;
    const shouldGenerateBranding = client_id === CLIENT_ID && avatarChanged && params.avatar;

    if (shouldGenerateBranding) {
      try {
        await this.brandingIconsService.generateVariantsForAvatar(params.avatar);
      } catch (error) {
        await this.brandingIconsService.deleteVariantsForAvatar(params.avatar);
        await deleteImageFromLocalPath(params.avatar);
        throw new BadRequestException('Failed to process client avatar', { cause: error });
      }
    }

    let updatedClient;
    try {
      updatedClient = await prisma.client.update({
        where: { client_id },
        data: {
          avatar: params.avatar,
          cover: params.cover,
        },
      });
    } catch (error) {
      if (avatarChanged && params.avatar) {
        await this.brandingIconsService.deleteVariantsForAvatar(params.avatar);
        await deleteImageFromLocalPath(params.avatar);
      }
      if (coverChanged && params.cover) {
        await deleteImageFromLocalPath(params.cover);
      }
      throw error;
    }

    if (avatarChanged && client?.avatar) {
      await this.brandingIconsService.deleteVariantsForAvatar(client.avatar);
      await deleteImageFromLocalPath(client.avatar);
    }
    if (coverChanged && client?.cover) {
      await deleteImageFromLocalPath(client.cover);
    }

    return updatedClient;
  }

  /**
   * Updating a user role in an application
   */
  async updateRole(user_id: string, client_id: string, params: dto.UpdateRoleDTO) {
    const [user, client] = await Promise.all([
      prisma.role.findUnique({
        where: { user_id_client_id: { user_id, client_id } },
        include: { user: true },
      }),
      prisma.client.findUnique({
        where: { client_id },
        select: {
          client_id: true,
          parent_id: true,
        },
      }),
    ]);

    if (!user || !client) {
      throw new NotFoundException(Ei18nCodes.T3E0003);
    }

    const userRole = convertToRoles(user.role);
    const organizationId = await getOrganizationId(client_id);
    let nextRole = params.role;

    if (userRole === UserRoles.OWNER) throw new BadRequestException(Ei18nCodes.T3E0009);

    if (nextRole === UserRoles.OWNER) throw new BadRequestException(Ei18nCodes.T3E0010);

    if (userRole === nextRole) return;

    if (nextRole === UserRoles.USER || nextRole === UserRoles.TRUSTED_USER) {
      const admins = await prisma.role.findMany({
        where: {
          client_id,
          role: { not: { in: [UserRoles.USER, UserRoles.TRUSTED_USER] } },
          user_id: { not: user_id },
        },
        select: {
          user_id: true,
        },
      });
      if (!admins.length) throw new BadRequestException(Ei18nCodes.T3E0011);
    }

    if (nextRole === UserRoles.MANAGER) {
      if (client_id !== CLIENT_ID) {
        throw new BadRequestException(Ei18nCodes.T3E0067);
      }
    }

    return prisma.$transaction(async (tx) => {
      await tx.role.upsert({
        where: { user_id_client_id: { user_id, client_id } },
        update: {
          role: nextRole,
        },
        create: { user_id, client_id, role: nextRole },
      });

      const userPlacementUpdate = await this.resolveUserPlacementForRoleUpdate(
        tx,
        user_id,
        client,
        nextRole,
        organizationId,
      );

      if (Object.keys(userPlacementUpdate).length) {
        await tx.user.update({
          where: { id: user_id },
          data: userPlacementUpdate,
        });
      }

      await syncGuestsMembershipForUser(tx, user_id, CLIENT_ID);

      if (client_id !== CLIENT_ID) {
        await syncOrganizationGuestsMembershipForUser(tx, user_id, organizationId);
      }
    });
  }

  /**
   * Creating a new organization client
   */
  private async createOrgClient(user_id: string): Promise<string> {
    const credential = await prisma.provider.findFirst({
      where: { type: PROVIDER_TYPE_CREDENTIALS },
      select: { id: true },
    });

    if (!credential) {
      throw new InternalServerErrorException(Ei18nCodes.T3E0071);
    }

    const existingOrgNames = await prisma.client.findMany({
      where: {
        client_id: { not: CLIENT_ID },
        parent_id: null,
      },
      select: {
        name: true,
      },
    });
    const nextOrganizationNumber =
      existingOrgNames.reduce((maxNumber, client) => {
        const name = resolveLocalizedText(client.name, ELocales.ru, ELocales.ru);
        const match = /^Organization\s+(\d+)$/i.exec(name);
        if (!match) {
          return maxNumber;
        }

        const parsedNumber = Number(match[1]);
        return Number.isFinite(parsedNumber) ? Math.max(maxNumber, parsedNumber) : maxNumber;
      }, 0) + 1;

    const organizationName = createLocalizedTextFallback(`Organization ${nextOrganizationNumber}`);

    return prisma.$transaction(async (tx) => {
      const id = generateRandomString(22);
      await tx.client.create({
        data: {
          widget_colors: { button_color: '#4C6AD4', font_color: '#fff', link_color: '#000' },
          name: organizationName,
          domain: DOMAIN + '/' + id,
          client_id: id,
          client_secret: generateRandomString(87),
          grant_types: ['authorization_code', 'refresh_token'],
          redirect_uris: [DOMAIN + '/' + id + '/code', DOMAIN + '/' + id + '/login'],
          post_logout_redirect_uris: [DOMAIN + '/' + id],
          token_endpoint_auth_method: 'none',
          introspection_endpoint_auth_method: 'none',
          revocation_endpoint_auth_method: 'none',
          roles: {
            create: {
              user_id,
              role: UserRoles.OWNER,
            },
          },
          providerRelations: { create: { provider_id: credential.id } },
        },
      });

      const directoryFolder = await tx.folder.create({
        data: {
          client_id: id,
          name: 'Directory',
          description: 'System folder for organization',
        },
        select: { id: true },
      });

      await tx.client.update({
        where: { client_id: id },
        data: {
          folder_id: directoryFolder.id,
        },
      });

      await ensureOrganizationGuestsGroup(tx, id);

      return id;
    });
  }

  /**
   * Deleting a user role in the application
   */
  async deleteRole(user_id: string, client_id: string) {
    const user = await prisma.role.findUnique({
      where: { user_id_client_id: { user_id, client_id } },
    });

    const userRole = convertToRoles(user.role);
    if (userRole === UserRoles.OWNER || userRole === UserRoles.MANAGER) {
      throw new BadRequestException(Ei18nCodes.T3E0025, {
        cause: userRole,
      });
    }

    if (client_id === CLIENT_ID) throw new BadRequestException(Ei18nCodes.T3E0012);

    await prisma.client.update({
      where: { client_id },
      data: {
        roles: {
          deleteMany: { user_id },
        },
        scopes: {
          deleteMany: { user_id },
        },
      },
    });

    await syncOrganizationGuestsMembershipForUser(
      prisma,
      user_id,
      await getOrganizationId(client_id),
    );
  }

  async findRoleInApp(user_id: string, client_id: string) {
    return this.roleRepo.findRoleInApp(user_id, client_id);
  }
}
