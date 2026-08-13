import { DOMAIN } from "./constants.js";

type TRoleAssignment = {
  client_id: string;
  role: string;
};

type TRolePermissionsPayload = {
  permissionsByRole: Record<string, string[]>;
  delegablePermissionsByRole: Record<string, string[]>;
};

const EMPTY_ROLE_PERMISSIONS: TRolePermissionsPayload = {
  permissionsByRole: {},
  delegablePermissionsByRole: {},
};

let cachedRolePermissions: TRolePermissionsPayload | null = null;
let pendingRolePermissionsRequest: Promise<TRolePermissionsPayload> | null =
  null;

function normalizePermissions(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value.filter(
        (permission): permission is string =>
          typeof permission === "string" && !!permission,
      ),
    ),
  ).sort();
}

function normalizePermissionsByRole(value: unknown): Record<string, string[]> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value as Record<string, unknown>).reduce<
    Record<string, string[]>
  >((acc, [role, permissions]) => {
    acc[role] = normalizePermissions(permissions);
    return acc;
  }, {});
}

function normalizeRolePermissionsPayload(
  payload: Partial<TRolePermissionsPayload> = {},
): TRolePermissionsPayload {
  return {
    permissionsByRole: normalizePermissionsByRole(payload.permissionsByRole),
    delegablePermissionsByRole: normalizePermissionsByRole(
      payload.delegablePermissionsByRole,
    ),
  };
}

async function fetchRolePermissions(): Promise<TRolePermissionsPayload> {
  const response = await fetch(`${DOMAIN}/api/v1/permissions/roles`);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch role permissions: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as Partial<TRolePermissionsPayload>;

  return normalizeRolePermissionsPayload(data);
}

async function getRolePermissions(): Promise<TRolePermissionsPayload> {
  if (cachedRolePermissions) {
    return cachedRolePermissions;
  }

  if (!pendingRolePermissionsRequest) {
    pendingRolePermissionsRequest = fetchRolePermissions()
      .then((payload) => {
        cachedRolePermissions = payload;
        return payload;
      })
      .catch((error) => {
        console.error("[OIDC] Failed to fetch role permissions:", error);
        return cachedRolePermissions || EMPTY_ROLE_PERMISSIONS;
      })
      .finally(() => {
        pendingRolePermissionsRequest = null;
      });
  }

  return pendingRolePermissionsRequest;
}

export function updateRolePermissionsCache(
  payload: Partial<TRolePermissionsPayload>,
): TRolePermissionsPayload {
  cachedRolePermissions = normalizeRolePermissionsPayload(payload);

  return cachedRolePermissions;
}

export async function getPermissionsByRole(
  role?: string | null,
): Promise<string[]> {
  if (!role) {
    return [];
  }

  const payload = await getRolePermissions();
  return payload.permissionsByRole[role] || [];
}

export async function getDelegablePermissionsByRole(
  role?: string | null,
): Promise<string[]> {
  if (!role) {
    return [];
  }

  const payload = await getRolePermissions();
  return payload.delegablePermissionsByRole[role] || [];
}

export async function getPermissionsForClientRole(
  roles: TRoleAssignment[],
  clientId: string,
): Promise<string[]> {
  const currentRole = roles.find((item) => item.client_id === clientId)?.role;
  return getPermissionsByRole(currentRole);
}

export async function getDelegablePermissionsForClientRole(
  roles: TRoleAssignment[],
  clientId: string,
): Promise<string[]> {
  const currentRole = roles.find((item) => item.client_id === clientId)?.role;
  return getDelegablePermissionsByRole(currentRole);
}
