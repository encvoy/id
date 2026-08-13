import { ExternalAccount, Prisma } from '@prisma/client';
import { CLIENT_ID } from 'src/constants';
import { EProviderTypes, IdentifierType } from 'src/enums';

const LEGACY_GENERAL_FIELD_KEYS = new Set([
  'sub',
  'login',
  'email',
  'given_name',
  'family_name',
  'phone_number',
  'birthdate',
  'nickname',
  'picture',
  'data_processing_agreement',
  'password',
]);

type ProfileValueRow = {
  value: Prisma.JsonValue | null;
  public: number | null;
};

export type LegacyUserModel = {
  id: string;
  hashed_password: string;
  password_updated_at: Date;
  password_change_required: boolean | null;
  locale: string | null;
  profile_privacy: boolean;
  card_url: string;
  card_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted: Date | null;
  blocked: boolean;
  org_id: string | null;
  folder_id: string;
  sub?: string;
  email?: string;
  email_verified?: boolean;
  birthdate?: string;
  family_name?: string;
  given_name?: string;
  login?: string;
  nickname?: string;
  phone_number?: string;
  phone_number_verified?: boolean;
  picture?: string;
  custom_fields?: Record<string, Prisma.JsonValue>;
  data_processing_agreement?: boolean;
  public_profile_claims_oauth: string;
  public_profile_claims_gravatar: string;
  ExternalAccount?: ExternalAccount[];
  Role?: Array<{
    role: string;
    client_id: string;
    parent_id: string | null;
    blocked: boolean;
  }>;
};

type LegacyRoleDescriptor = {
  client_id: string;
  blocked?: boolean | null;
};

export const legacyUserInclude = {
  profile_values: {
    include: {
      profile_field: {
        select: {
          key: true,
          default_public: true,
        },
      },
    },
  },
  externalAccounts: true,
  roles: {
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
} satisfies Prisma.UserInclude;

type UserWithLegacyRelations = Prisma.UserGetPayload<{
  include: typeof legacyUserInclude;
}>;

function asString(value: Prisma.JsonValue | null | undefined): string | undefined {
  return typeof value === 'string' && value.length ? value : undefined;
}

function asBoolean(value: Prisma.JsonValue | null | undefined): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function buildProfileValueMap(profileValues: UserWithLegacyRelations['profile_values']) {
  return profileValues.reduce<Record<string, ProfileValueRow>>((acc, item) => {
    acc[item.profile_field.key] = {
      value: item.value,
      public: item.public ?? item.profile_field.default_public,
    };
    return acc;
  }, {});
}

function getPublicClaims(map: Record<string, ProfileValueRow>, minLevel: number) {
  const keys = Object.entries(map)
    .filter(([key, row]) => key !== 'password' && (row.public ?? 0) >= minLevel)
    .map(([key]) => key)
    .sort();

  return Array.from(new Set(['id', ...keys]))
    .join(' ')
    .trim();
}

function buildCustomFields(map: Record<string, ProfileValueRow>) {
  return Object.entries(map).reduce<Record<string, Prisma.JsonValue>>((acc, [key, row]) => {
    if (!LEGACY_GENERAL_FIELD_KEYS.has(key) && row.value !== null) {
      acc[key] = row.value;
    }

    return acc;
  }, {});
}

export function getBlockedFromLegacyRoles(
  roles: LegacyRoleDescriptor[] | null | undefined,
  clientId = CLIENT_ID,
): boolean {
  return Boolean(roles?.find((role) => role.client_id === clientId)?.blocked);
}

export function withLegacyUserBlocked(
  user: LegacyUserModel | null,
  clientId = CLIENT_ID,
): LegacyUserModel | null {
  if (!user) {
    return null;
  }

  return {
    ...user,
    blocked: getBlockedFromLegacyRoles(user.Role, clientId),
  };
}

function isVerifiedByExternalAccount(
  externalAccounts: ExternalAccount[] | undefined,
  type: EProviderTypes.EMAIL | EProviderTypes.PHONE,
  value?: string,
) {
  if (!value || !externalAccounts?.length) {
    return false;
  }

  const acceptedTypes =
    type === EProviderTypes.EMAIL
      ? new Set([EProviderTypes.EMAIL, EProviderTypes.EMAIL_CUSTOM])
      : new Set([EProviderTypes.PHONE, EProviderTypes.KLOUD]);

  return externalAccounts.some(
    (account) => acceptedTypes.has(account.type as EProviderTypes) && account.sub === value,
  );
}

export function toLegacyUser(user: UserWithLegacyRelations | null): LegacyUserModel | null {
  if (!user) {
    return null;
  }

  const { profile_values, externalAccounts, roles, ...baseUser } = user;
  const map = buildProfileValueMap(profile_values);

  const email = asString(map.email?.value);
  const phoneNumber = asString(map.phone_number?.value);
  const customFields = buildCustomFields(map);

  const legacyRoles = roles
    .map((role) => ({
      role: role.role,
      client_id: role.client_id,
      parent_id: role.client?.parent_id ?? null,
      blocked: Boolean(role.blocked),
    }))
    .sort((left, right) => {
      if (left.client_id === CLIENT_ID && right.client_id !== CLIENT_ID) {
        return -1;
      }

      if (left.client_id !== CLIENT_ID && right.client_id === CLIENT_ID) {
        return 1;
      }

      return left.client_id.localeCompare(right.client_id);
    });

  return {
    ...baseUser,
    blocked: getBlockedFromLegacyRoles(legacyRoles),
    sub: asString(map.sub?.value) || user.id,
    email,
    email_verified: isVerifiedByExternalAccount(externalAccounts, EProviderTypes.EMAIL, email),
    birthdate: asString(map.birthdate?.value),
    family_name: asString(map.family_name?.value),
    given_name: asString(map.given_name?.value),
    login: asString(map.login?.value),
    nickname: asString(map.nickname?.value),
    phone_number: phoneNumber,
    phone_number_verified: isVerifiedByExternalAccount(
      externalAccounts,
      EProviderTypes.PHONE,
      phoneNumber,
    ),
    picture: asString(map.picture?.value),
    data_processing_agreement: asBoolean(map.data_processing_agreement?.value),
    custom_fields: Object.keys(customFields).length ? customFields : undefined,
    public_profile_claims_oauth: getPublicClaims(map, 1),
    public_profile_claims_gravatar: getPublicClaims(map, 2),
    ExternalAccount: externalAccounts,
    Role: legacyRoles,
  };
}

function buildProfileFieldWhere(key: string, value: string): Prisma.UserWhereInput {
  return {
    profile_values: {
      some: {
        profile_field: {
          key,
        },
        value: {
          equals: value,
        },
      },
    },
  };
}

export function buildLegacyIdentifierWhere(
  identifier: string,
  type: IdentifierType,
): Prisma.UserWhereInput {
  switch (type) {
    case IdentifierType.Email:
      return {
        OR: [
          buildProfileFieldWhere('email', identifier),
          {
            externalAccounts: {
              some: {
                sub: identifier,
                type: {
                  in: [EProviderTypes.EMAIL, EProviderTypes.EMAIL_CUSTOM],
                },
              },
            },
          },
        ],
      };
    case IdentifierType.PhoneNumber:
      return {
        OR: [
          buildProfileFieldWhere('phone_number', identifier),
          {
            externalAccounts: {
              some: {
                sub: identifier,
                type: {
                  in: [EProviderTypes.PHONE, EProviderTypes.KLOUD],
                },
              },
            },
          },
        ],
      };
    case IdentifierType.Login:
      return buildProfileFieldWhere('login', identifier);
    case IdentifierType.ID:
    default:
      return {
        id: identifier,
      };
  }
}
