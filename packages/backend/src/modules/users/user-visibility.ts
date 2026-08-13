import { LegacyUserModel } from '../repository/user-compat';

export type TUserProfileResponse = Omit<LegacyUserModel, 'ExternalAccount'>;

const parseClaims = (claims?: string) =>
  (claims || '')
    .split(' ')
    .map((item) => item.trim())
    .filter(Boolean);

const filterByAllowedKeys = (value: unknown, allowedKeys: Set<string>): unknown => {
  if (Array.isArray(value)) {
    const items = value
      .map((item) => filterByAllowedKeys(item, allowedKeys))
      .filter((item) => item !== undefined);

    return items.length ? items : undefined;
  }

  if (typeof value !== 'object' || value === null) {
    return value;
  }

  const filteredEntries = Object.entries(value)
    .map(([key, entryValue]) => {
      if (typeof entryValue === 'object' && entryValue !== null) {
        const nestedValue = filterByAllowedKeys(entryValue, allowedKeys);
        return nestedValue === undefined ? null : [key, nestedValue];
      }

      return allowedKeys.has(key) ? [key, entryValue] : null;
    })
    .filter((entry): entry is [string, unknown] => Boolean(entry));

  if (!filteredEntries.length) {
    return undefined;
  }

  return Object.fromEntries(filteredEntries);
};

export const getOauthPublicClaims = (user: Pick<LegacyUserModel, 'public_profile_claims_oauth'>) =>
  Array.from(new Set(['id', ...parseClaims(user.public_profile_claims_oauth)]));

export const toPublicLegacyUser = (
  user: LegacyUserModel,
  options?: {
    includeTopLevelKeys?: Array<keyof LegacyUserModel>;
  },
) => {
  const allowedKeys = new Set(getOauthPublicClaims(user));
  const filteredUser = (filterByAllowedKeys(user, allowedKeys) || {}) as Partial<LegacyUserModel>;

  if (options?.includeTopLevelKeys?.length) {
    for (const key of options.includeTopLevelKeys) {
      filteredUser[key] = user[key] as never;
    }
  }

  filteredUser.id = user.id;

  return filteredUser;
};

export const toUserProfileResponse = (
  user: LegacyUserModel | null,
): TUserProfileResponse | null => {
  if (!user) {
    return null;
  }

  const { ExternalAccount, ...profile } = user;
  return profile;
};
