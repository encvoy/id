import { Request } from 'express';
import { UserRoles } from './enums';
import { getPermissionsByRole } from './role-permissions';

export type TokenKind = 'session' | 'personal_access' | 'capability';

export type TAuthContext = {
  userId: string | null;
  tokenKind: TokenKind;
  systemRole: UserRoles;
  clientRole?: UserRoles;
  effectiveRole: UserRoles;
  rawTokenPermissions: string[];
  effectivePermissions: string[];
  targetClientId?: string;
  tokenClientId?: string;
};

export const AUTH_CONTEXT_KEY = 'authContext';

export type TAuthContextRequest = Request & {
  tokenClientId?: string;
  tokenPermissions?: string[];
  rawTokenPermissions?: string[];
  [AUTH_CONTEXT_KEY]?: TAuthContext;
};

function normalizePermissions(value: string[] | undefined): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(new Set(value.map((permission) => permission.trim()).filter(Boolean))).sort();
}

function intersectPermissions(rolePermissions: string[], tokenPermissions: string[]): string[] {
  const tokenPermissionsSet = new Set(tokenPermissions);

  return rolePermissions.filter((permission) => tokenPermissionsSet.has(permission));
}

export function normalizeTokenKind(value: unknown): TokenKind {
  switch (value) {
    case 'personal_access':
      return 'personal_access';
    case 'capability':
      return 'capability';
    case 'session':
    default:
      return 'session';
  }
}

export function resolveRequestPermissions(params: {
  role?: UserRoles | null;
  rawTokenPermissions?: string[];
  tokenKind?: TokenKind;
  isBearerTokenAuth?: boolean;
}): string[] {
  const rolePermissions = getPermissionsByRole(params.role);
  const rawTokenPermissions = normalizePermissions(params.rawTokenPermissions);

  if (!params.isBearerTokenAuth) {
    return rolePermissions;
  }

  switch (params.tokenKind) {
    case 'personal_access':
    case 'capability':
      return intersectPermissions(rolePermissions, rawTokenPermissions);
    case 'session':
    default:
      return rolePermissions;
  }
}

export function createAuthContext(): TAuthContext {
  return {
    userId: null,
    tokenKind: 'session',
    systemRole: UserRoles.NONE,
    effectiveRole: UserRoles.NONE,
    rawTokenPermissions: [],
    effectivePermissions: [],
  };
}
