import { ExternalAccount, Prisma } from "@prisma/client";
import { CLIENT_ID } from "./constants.js";

const GENERAL_PROFILE_FIELD_KEYS = new Set([
  "sub",
  "login",
  "email",
  "given_name",
  "family_name",
  "phone_number",
  "birthdate",
  "nickname",
  "picture",
  "data_processing_agreement",
  "password",
]);

const EMAIL_ACCOUNT_TYPES = new Set(["EMAIL", "EMAIL_CUSTOM"]);
const PHONE_ACCOUNT_TYPES = new Set(["PHONE", "KLOUD"]);

type ProfileValueRow = {
  value: Prisma.JsonValue | null;
  public: number | null;
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
      client_id: true,
      blocked: true,
    },
  },
} satisfies Prisma.UserInclude;

type UserWithLegacyRelations = Prisma.UserGetPayload<{
  include: typeof legacyUserInclude;
}>;

function asString(value: Prisma.JsonValue | null | undefined) {
  return typeof value === "string" && value.length ? value : undefined;
}

function buildProfileValueMap(
  profileValues: UserWithLegacyRelations["profile_values"],
) {
  return profileValues.reduce<Record<string, ProfileValueRow>>((acc, item) => {
    acc[item.profile_field.key] = {
      value: item.value,
      public: item.public ?? item.profile_field.default_public,
    };
    return acc;
  }, {});
}

function getPublicClaims(
  map: Record<string, ProfileValueRow>,
  minLevel: number,
) {
  const keys = Object.entries(map)
    .filter(([key, row]) => key !== "password" && (row.public ?? 0) >= minLevel)
    .map(([key]) => key)
    .sort();

  return Array.from(new Set(["id", ...keys]))
    .join(" ")
    .trim();
}

function buildCustomFields(map: Record<string, ProfileValueRow>) {
  return Object.entries(map).reduce<Record<string, Prisma.JsonValue>>(
    (acc, [key, row]) => {
      if (!GENERAL_PROFILE_FIELD_KEYS.has(key) && row.value !== null) {
        acc[key] = row.value;
      }

      return acc;
    },
    {},
  );
}

function isVerified(
  externalAccounts: ExternalAccount[] | undefined,
  acceptedTypes: Set<string>,
  value?: string,
) {
  if (!value || !externalAccounts?.length) {
    return false;
  }

  return externalAccounts.some(
    (account) => acceptedTypes.has(account.type) && account.sub === value,
  );
}

export function toLegacyUser(user: UserWithLegacyRelations | null) {
  if (!user) {
    return null;
  }

  const { profile_values, externalAccounts, roles, ...baseUser } = user;
  const map = buildProfileValueMap(profile_values);
  const email = asString(map.email?.value);
  const phoneNumber = asString(map.phone_number?.value);
  const customFields = buildCustomFields(map);
  const blocked = Boolean(
    roles.find((role) => role.client_id === CLIENT_ID)?.blocked,
  );

  return {
    ...baseUser,
    blocked,
    sub: asString(map.sub?.value) || user.id,
    email,
    email_verified: isVerified(externalAccounts, EMAIL_ACCOUNT_TYPES, email),
    birthdate: asString(map.birthdate?.value),
    family_name: asString(map.family_name?.value),
    given_name: asString(map.given_name?.value),
    login: asString(map.login?.value),
    nickname: asString(map.nickname?.value),
    phone_number: phoneNumber,
    phone_number_verified: isVerified(
      externalAccounts,
      PHONE_ACCOUNT_TYPES,
      phoneNumber,
    ),
    picture: asString(map.picture?.value),
    data_processing_agreement:
      typeof map.data_processing_agreement?.value === "boolean"
        ? map.data_processing_agreement.value
        : undefined,
    custom_fields: Object.keys(customFields).length ? customFields : undefined,
    public_profile_claims_oauth: getPublicClaims(map, 1),
    public_profile_claims_gravatar: getPublicClaims(map, 2),
    ExternalAccount: externalAccounts,
  };
}
