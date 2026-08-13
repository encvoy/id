export interface IUserAutocompleteOption {
  id: string;
  folder_id?: string;
  login?: string;
  email?: string | null;
  external_emails?: string[];
  nickname?: string;
  given_name?: string;
  family_name?: string;
  picture?: string | null;
  blocked?: boolean;
}

const normalizeUserSearchValue = (value?: string | null) =>
  value?.trim().toLowerCase() || "";

const getUserFullName = (user?: IUserAutocompleteOption | null) => {
  const fullName = `${user?.given_name || ""} ${
    user?.family_name || ""
  }`.trim();

  return fullName;
};

export const getUserAutocompletePrimaryLabel = (
  user?: IUserAutocompleteOption | null
) => {
  const fullName = getUserFullName(user);

  return (
    fullName ||
    user?.login ||
    user?.nickname ||
    user?.email ||
    user?.external_emails?.[0] ||
    user?.id ||
    ""
  );
};

export const getUserAutocompleteSecondaryLabel = (
  user?: IUserAutocompleteOption | null
) => {
  if (!user) {
    return "";
  }

  const seenValues = new Set<string>();
  const primaryValue = normalizeUserSearchValue(
    getUserAutocompletePrimaryLabel(user)
  );

  if (primaryValue) {
    seenValues.add(primaryValue);
  }

  const searchFields = [
    user.login,
    user.nickname,
    user.email,
    ...(user.external_emails || []),
    user.id,
  ].filter((value): value is string => Boolean(value?.trim()));

  return searchFields
    .filter((value) => {
      const normalizedValue = normalizeUserSearchValue(value);

      if (!normalizedValue || seenValues.has(normalizedValue)) {
        return false;
      }

      seenValues.add(normalizedValue);
      return true;
    })
    .join(" • ");
};
