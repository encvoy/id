import { UserRoles } from './enums';
import { ROLES } from './roles';

export const NON_DELEGABLE_PERMISSIONS = new Set<string>(['tokens:create']);

function normalizePermissions(value: string[] | undefined): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(new Set(value.map((permission) => permission.trim()).filter(Boolean))).sort();
}

export function getPermissionsByRole(role?: UserRoles | string | null): string[] {
  if (!role) {
    return [];
  }

  return normalizePermissions(ROLES.get(role as UserRoles) || []);
}

export function getDelegablePermissionsByRole(role?: UserRoles | string | null): string[] {
  return getPermissionsByRole(role).filter((permission) => !NON_DELEGABLE_PERMISSIONS.has(permission));
}

function getPermissionsMap(
  getter: (role: UserRoles) => string[],
): Record<UserRoles, string[]> {
  return Object.values(UserRoles).reduce(
    (acc, role) => {
      acc[role] = getter(role);
      return acc;
    },
    {} as Record<UserRoles, string[]>,
  );
}

export function getRolePermissionsPayload() {
  return {
    permissionsByRole: getPermissionsMap(getPermissionsByRole),
    delegablePermissionsByRole: getPermissionsMap(getDelegablePermissionsByRole),
  };
}
