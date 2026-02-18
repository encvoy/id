import { UserRoles } from './enums';

/**
 * User roles.
 * Enumeration of user roles and their scopes.
 */
export const ROLES = new Map<UserRoles, string[]>(
  Object.values(UserRoles).map((role) => [role, []]),
);
