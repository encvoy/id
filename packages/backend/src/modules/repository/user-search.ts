import { EProviderTypes } from 'src/enums';
import { LegacyUserModel } from './user-compat';

export const legacyUserEmailExternalAccountTypes = [
  EProviderTypes.EMAIL,
  EProviderTypes.EMAIL_CUSTOM,
] as const;

export const legacyUserPhoneExternalAccountTypes = [
  EProviderTypes.PHONE,
  EProviderTypes.KLOUD,
] as const;

const legacyUserEmailExternalAccountTypeSet = new Set<string>(legacyUserEmailExternalAccountTypes);
const legacyUserPhoneExternalAccountTypeSet = new Set<string>(legacyUserPhoneExternalAccountTypes);

function getLegacyUserExternalAccountValues(
  user: Pick<LegacyUserModel, 'ExternalAccount'> | null | undefined,
  acceptedTypes: Set<string>,
) {
  const values = new Set<string>();

  for (const account of user?.ExternalAccount || []) {
    if (acceptedTypes.has(account.type) && account.sub) {
      values.add(account.sub);
    }
  }

  return Array.from(values);
}

export function getLegacyUserExternalAccountEmails(
  user: Pick<LegacyUserModel, 'ExternalAccount'> | null | undefined,
) {
  return getLegacyUserExternalAccountValues(user, legacyUserEmailExternalAccountTypeSet);
}

export function getLegacyUserExternalAccountPhones(
  user: Pick<LegacyUserModel, 'ExternalAccount'> | null | undefined,
) {
  return getLegacyUserExternalAccountValues(user, legacyUserPhoneExternalAccountTypeSet);
}

export function getLegacyUserPrimaryExternalAccountEmail(
  user: Pick<LegacyUserModel, 'ExternalAccount'> | null | undefined,
) {
  return getLegacyUserExternalAccountEmails(user)[0];
}

export function getLegacyUserPrimaryExternalAccountPhone(
  user: Pick<LegacyUserModel, 'ExternalAccount'> | null | undefined,
) {
  return getLegacyUserExternalAccountPhones(user)[0];
}

export function getLegacyUserRecoveryEmail(
  user: Pick<LegacyUserModel, 'email' | 'ExternalAccount'> | null | undefined,
) {
  const contactEmail = user?.email?.trim();
  const externalEmails = getLegacyUserExternalAccountEmails(user);

  if (contactEmail && externalEmails.includes(contactEmail)) {
    return contactEmail;
  }

  return getLegacyUserPrimaryExternalAccountEmail(user);
}

export function getLegacyUserSearchEmails(
  user: Pick<LegacyUserModel, 'ExternalAccount'> | null | undefined,
) {
  const emails = new Set<string>();

  const appendEmail = (value?: string | null) => {
    const normalizedValue = value?.trim().toLowerCase();
    if (normalizedValue) {
      emails.add(normalizedValue);
    }
  };

  for (const account of user?.ExternalAccount || []) {
    if (legacyUserEmailExternalAccountTypeSet.has(account.type)) {
      appendEmail(account.sub);
    }
  }

  return Array.from(emails);
}

export function matchesLegacyUserEmailSearch(
  user: Pick<LegacyUserModel, 'ExternalAccount'> | null | undefined,
  search?: string,
) {
  const normalizedSearch = search?.trim().toLowerCase();
  if (!normalizedSearch) {
    return true;
  }

  return getLegacyUserSearchEmails(user).some((email) => email.includes(normalizedSearch));
}
