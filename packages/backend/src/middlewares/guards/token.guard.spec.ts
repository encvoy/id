let mockNodeEnv = 'development';

jest.mock('../../modules/prisma/prisma.client', () => ({
  prisma: {
    role: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('src/main', () => ({
  app: {
    get: jest.fn(),
  },
}));

// Simplify middleware so FilesInterceptor does not fail while importing modules.
jest.mock('../../middlewares', () => ({
  FilesInterceptor: jest.fn(() => {
    return class {};
  }),
}));

jest.mock('src/role-permissions', () => ({
  getPermissionsByRole: jest.fn(() => ['perm.role']),
}));

jest.mock('../../helpers', () => ({
  convertToRoles: jest.fn(() => 'ADMIN'),
}));

jest.mock('../../constants', () => ({
  CLIENT_ID: 'MAIN_CLIENT',
  get NODE_ENV() {
    return mockNodeEnv;
  },
}));

import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
// BadRequestException,
import { Reflector } from '@nestjs/core';
import { Ei18nCodes, UserRoles } from 'src/enums';
import { BASIC_AUTH_KEY, NEGOTIATE_AUTH_KEY, ROLE_KEY, USER_ID_KEY } from 'src/decorators';
import { app } from 'src/main';
import { AUTH_CONTEXT_KEY } from 'src/request-auth';
import { getPermissionsByRole } from 'src/role-permissions';
import { convertToRoles } from '../../helpers';
import { prisma } from '../../modules/prisma/prisma.client';
import { AuthService } from '../../modules/auth/auth.service';
import { OidcService } from '../../modules/oidc/oidc.service';
import { SettingsService } from '../../modules/settings/settings.service';
import { TokenGuard } from './token.guard';

type TReq = {
  headers: Record<string, string>;
  tokenPermissions?: string[];
  tokenClientId?: string;
  user_id?: string | null;
  role?: UserRoles;
};

const createContextWithRequest = (
  req: Partial<TReq>,
): { context: ExecutionContext; request: TReq } => {
  const request: TReq = {
    headers: {},
    ...req,
  } as TReq;

  const context: ExecutionContext = {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => ({} as any),
  } as any;

  return { context, request };
};

describe('TokenGuard', () => {
  let reflector: Reflector;
  let reflectorGetMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    reflectorGetMock = jest.fn();
    reflector = { get: reflectorGetMock } as any;
    mockNodeEnv = 'development';
  });

  describe('service getters', () => {
    it.each<
      [
        'oidcService' | 'authService' | 'settingsService',
        Record<string, jest.Mock>,
        typeof OidcService | typeof AuthService | typeof SettingsService,
      ]
    >([
      ['oidcService', { tokenIntrospection: jest.fn() }, OidcService],
      ['authService', { checkUserCredentials: jest.fn() }, AuthService],
      [
        'settingsService',
        { isAuthorizeOnlyAdminsEnabled: jest.fn().mockResolvedValue(false) },
        SettingsService,
      ],
    ])('caches %s getter value', (getterName, serviceMock, serviceToken) => {
      const guard = new TokenGuard(reflector);
      (app.get as jest.Mock).mockReturnValue(serviceMock);

      const first = (guard as any)[getterName];
      const second = (guard as any)[getterName];

      expect(first).toBe(serviceMock);
      expect(second).toBe(serviceMock);
      expect(app.get).toHaveBeenCalledTimes(1);
      expect(app.get).toHaveBeenCalledWith(serviceToken);
    });
  });

  describe('canActivate', () => {
    // Verify behavior when the authorization header is undefined.
    it.each<[string, string | undefined, any]>([
      ['missing Authorization header', undefined, null],
      ['Bearer token with undefined-like value', 'Bearer undefined-token', null],
      ['Negotiate when handler allows it', 'Negotiate', true],
    ])('handles %s', async (_title, authorization, reflectorReturnValue) => {
      const guard = new TokenGuard(reflector);

      const headers = authorization ? { authorization } : {};
      const { context, request } = createContextWithRequest({ headers });

      if (reflectorReturnValue !== null) {
        reflectorGetMock.mockReturnValue(reflectorReturnValue);
      }

      await expect(guard.canActivate(context)).resolves.toBe(true);

      expect(request.tokenPermissions).toEqual([]);
      expect(request.tokenClientId).toBeUndefined();
      expect(request[ROLE_KEY]).toBe(UserRoles.NONE);
      expect(request[USER_ID_KEY]).toBeNull();
    });

    // Verify the early return from Bearer authentication for an invalid token.
    it.each<[string, string]>([
      ['empty bearer token', 'Bearer '],
      ['undefined-like bearer token', 'Bearer undefined-token'],
    ])('returns true and skips introspection for %s', async (_title, authorization) => {
      const guard = new TokenGuard(reflector);

      const { context } = createContextWithRequest({
        headers: { authorization },
      });

      await expect(guard.canActivate(context)).resolves.toBe(true);
      expect(app.get).not.toHaveBeenCalled();
      expect(prisma.role.findUnique).not.toHaveBeenCalled();
    });

    // Verify the early return from Basic authentication for empty credentials.
    it('returns true for empty Basic credentials and checks BASIC_AUTH_KEY', async () => {
      const guard = new TokenGuard(reflector);
      const { context } = createContextWithRequest({
        headers: { authorization: 'Basic ' },
      });

      reflectorGetMock.mockReturnValue(true);
      await expect(guard.canActivate(context)).resolves.toBe(true);

      expect(reflectorGetMock).toHaveBeenCalledWith(BASIC_AUTH_KEY, expect.anything());
      expect(app.get).not.toHaveBeenCalled();
      expect(prisma.role.findUnique).not.toHaveBeenCalled();
    });

    // Verify the Negotiate error code when the handler rejects authentication.
    it.each<[string, string]>([
      ['Negotiate without token', 'Negotiate'],
      ['Negotiate with token', 'Negotiate token'],
    ])('throws T3E0061 for %s when not allowed', async (_title, authorization) => {
      const guard = new TokenGuard(reflector);
      const { context } = createContextWithRequest({
        headers: { authorization },
      });

      reflectorGetMock.mockReturnValue(false);
      await expect(guard.canActivate(context)).rejects.toMatchObject({
        response: {
          message: Ei18nCodes.T3E0061,
        },
      });
      expect(reflectorGetMock).toHaveBeenCalledWith(NEGOTIATE_AUTH_KEY, expect.anything());
    });

    // Verify the resulting permissions after Bearer authentication.
    it.each<[string, string[], 'session' | 'personal_access', string[]]>([
      [
        'Bearer personal_access token uses intersection with role permissions',
        ['perm.read', 'scope.a'],
        'personal_access',
        ['perm.read'],
      ],
      ['Bearer session token uses role permissions', [], 'session', ['perm.read', 'perm.write']],
    ])(
      'resolves permissions for %s',
      async (_title, bearerPermissions, tokenKind, expectedPermissions) => {
        const guard = new TokenGuard(reflector);
        const { context, request } = createContextWithRequest({
          headers: { authorization: 'Bearer valid-token' },
        });

        (app.get as jest.Mock).mockReturnValue({
          tokenIntrospection: jest.fn().mockResolvedValue({
            active: true,
            client_id: 'MAIN_CLIENT',
            user_id: '10',
            tokenPermissions: bearerPermissions,
            tokenKind,
          }),
          isAuthorizeOnlyAdminsEnabled: jest.fn().mockResolvedValue(false),
        });
        (prisma.role.findUnique as jest.Mock).mockResolvedValue({
          role: 'ADMIN',
          user: {
            blocked: false,
            deleted: false,
            email: 'test@example.com',
          },
        });
        (convertToRoles as jest.Mock).mockReturnValue(UserRoles.ADMIN);
        (getPermissionsByRole as jest.Mock).mockReturnValue(['perm.read', 'perm.write']);

        await expect(guard.canActivate(context)).resolves.toBe(true);

        expect(request[USER_ID_KEY]).toBe('10');
        expect(request[ROLE_KEY]).toBe(UserRoles.ADMIN);
        expect(request.tokenPermissions).toEqual(expectedPermissions);
        expect(getPermissionsByRole).toHaveBeenCalledWith(UserRoles.ADMIN);
      },
    );

    // Verify Basic authentication and role permissions.
    it('authenticates via Basic and uses role permissions', async () => {
      const guard = new TokenGuard(reflector);
      const creds = Buffer.from('login:password').toString('base64');
      const { context, request } = createContextWithRequest({
        headers: { authorization: `Basic ${creds}` },
      });
      const checkUserCredentials = jest.fn().mockResolvedValue({ id: 42 });

      reflectorGetMock.mockReturnValue(true);
      (app.get as jest.Mock).mockImplementation((serviceToken: any) => {
        if (serviceToken === AuthService) {
          return {
            checkUserCredentials,
          };
        }
        if (serviceToken === SettingsService) {
          return {
            isAuthorizeOnlyAdminsEnabled: jest.fn().mockResolvedValue(false),
          };
        }
        return {
          tokenIntrospection: jest.fn(),
        };
      });
      (prisma.role.findUnique as jest.Mock).mockResolvedValue({
        role: 'ADMIN',
        user: {
          blocked: false,
          deleted: false,
          email: 'test@example.com',
        },
      });
      (convertToRoles as jest.Mock).mockReturnValue(UserRoles.ADMIN);
      (getPermissionsByRole as jest.Mock).mockReturnValue(['perm.basic']);

      await expect(guard.canActivate(context)).resolves.toBe(true);

      expect(request[USER_ID_KEY]).toBe('42');
      expect(request[ROLE_KEY]).toBe(UserRoles.ADMIN);
      expect(request.tokenPermissions).toEqual(['perm.basic']);
      expect(checkUserCredentials).toHaveBeenCalledWith('login', 'password');
      expect(reflectorGetMock).toHaveBeenCalledWith(BASIC_AUTH_KEY, expect.anything());
    });

    // Verify the Basic authentication error when login or password is missing.
    it.each<[string, string]>([
      ['missing identifier', ':password'],
      ['missing password', 'login:'],
    ])('throws T3E0060 for Basic with %s', async (_title, pair) => {
      const guard = new TokenGuard(reflector);
      const { context } = createContextWithRequest({
        headers: { authorization: `Basic ${Buffer.from(pair).toString('base64')}` },
      });

      reflectorGetMock.mockReturnValue(true);

      await expect(guard.canActivate(context)).rejects.toMatchObject({
        response: {
          message: Ei18nCodes.T3E0060,
        },
      });

      expect(reflectorGetMock).toHaveBeenCalledWith(BASIC_AUTH_KEY, expect.anything());
      expect(app.get).not.toHaveBeenCalled();
      expect(prisma.role.findUnique).not.toHaveBeenCalled();
    });

    // Verify errors for an invalid Bearer token and client ID.
    it.each<
      [
        string,
        Partial<{
          active: boolean | null;
          client_id: string | null | undefined;
        }>,
        new (...args: any[]) => Error,
      ]
    >([
      [
        'inactive Bearer token with undefined client_id',
        { active: false, client_id: undefined },
        UnauthorizedException,
      ],
      [
        'inactive Bearer token with null client_id',
        { active: false, client_id: null },
        UnauthorizedException,
      ],
      [
        'inactive Bearer token with empty client_id',
        { active: false, client_id: '' },
        UnauthorizedException,
      ],
      [
        'foreign client_id with active=true',
        { active: true, client_id: 'FOREIGN_CLIENT' },
        ForbiddenException,
      ],
      [
        'foreign client_id with active=undefined',
        { active: undefined, client_id: 'FOREIGN_CLIENT' },
        ForbiddenException,
      ],
      [
        'foreign client_id with active=null',
        { active: null, client_id: 'FOREIGN_CLIENT' },
        ForbiddenException,
      ],
    ])('throws for %s', async (_title, tokenInfoOverride, expectedError) => {
      const guard = new TokenGuard(reflector);
      const { context } = createContextWithRequest({
        headers: { authorization: 'Bearer valid-token' },
      });

      const tokenInfo = {
        active: true,
        client_id: 'MAIN_CLIENT',
        user_id: '10',
        tokenPermissions: ['scope.a'],
        ...tokenInfoOverride,
      };

      (app.get as jest.Mock).mockReturnValue({
        tokenIntrospection: jest.fn().mockResolvedValue(tokenInfo),
      });

      await expect(guard.canActivate(context)).rejects.toBeInstanceOf(expectedError);
    });

    // Verify errors for unsupported or forbidden authorization schemes.
    it.each<
      [
        string,
        {
          authorization: string;
          expectedMessage: Ei18nCodes;
          nodeEnv?: 'development' | 'production';
          basicAllowed?: boolean;
          expectBasicReflectorCall?: boolean;
        },
      ]
    >([
      [
        'malformed Basic credentials',
        {
          authorization: `Basic ${Buffer.from('identifier-only').toString('base64')}`,
          expectedMessage: Ei18nCodes.T3E0060,
          basicAllowed: true,
          expectBasicReflectorCall: true,
        },
      ],
      [
        'Basic in production when not allowed',
        {
          authorization: `Basic ${Buffer.from('login:password').toString('base64')}`,
          expectedMessage: Ei18nCodes.T3E0077,
          nodeEnv: 'production',
          basicAllowed: false,
          expectBasicReflectorCall: true,
        },
      ],
      [
        'unsupported auth scheme',
        {
          authorization: 'Unknown xyz',
          expectedMessage: Ei18nCodes.T3E0061,
        },
      ],
    ])('throws %s', async (_title, params) => {
      const { authorization, expectedMessage, nodeEnv, basicAllowed, expectBasicReflectorCall } =
        params;

      if (nodeEnv) {
        mockNodeEnv = nodeEnv;
      }
      if (expectBasicReflectorCall) {
        reflectorGetMock.mockReturnValue(basicAllowed ?? true);
      }

      const guard = new TokenGuard(reflector);
      const { context } = createContextWithRequest({
        headers: { authorization },
      });

      await expect(guard.canActivate(context)).rejects.toMatchObject({
        response: {
          message: expectedMessage,
        },
      });
      if (expectBasicReflectorCall) {
        expect(reflectorGetMock).toHaveBeenCalledWith(BASIC_AUTH_KEY, expect.anything());
      }
      expect(app.get).not.toHaveBeenCalled();
      expect(prisma.role.findUnique).not.toHaveBeenCalled();
    });

    // Verify error handling after successful Bearer authentication.
    it.each<[string, { blocked: boolean; deleted: boolean } | null, Ei18nCodes | 'DELETED']>([
      ['role item is not found', null, Ei18nCodes.T3E0059],
      ['user is blocked', { blocked: true, deleted: false }, Ei18nCodes.T3E0024],
      ['user is marked as deleted', { blocked: false, deleted: true }, 'DELETED'],
    ])('throws %s', async (_title, roleState, expectedMessage) => {
      const guard = new TokenGuard(reflector);
      const { context } = createContextWithRequest({
        headers: { authorization: 'Bearer valid-token' },
      });

      const roleItem = roleState
        ? {
            role: 'ADMIN',
            user: {
              blocked: roleState.blocked,
              deleted: roleState.deleted,
              email: 'test@example.com',
            },
          }
        : null;

      (app.get as jest.Mock).mockReturnValue({
        tokenIntrospection: jest.fn().mockResolvedValue({
          active: true,
          client_id: 'MAIN_CLIENT',
          user_id: '10',
          tokenPermissions: ['scope.a'],
          tokenKind: 'session',
        }),
        isAuthorizeOnlyAdminsEnabled: jest.fn().mockResolvedValue(false),
      });
      (prisma.role.findUnique as jest.Mock).mockResolvedValue(roleItem);
      if (roleState) {
        (convertToRoles as jest.Mock).mockReturnValue(UserRoles.ADMIN);
      }

      await expect(guard.canActivate(context)).rejects.toMatchObject({
        response: {
          message: expectedMessage,
        },
      });
    });

    // Verify NODE_ENV and user-role branches.
    it.each<
      [
        string,
        {
          nodeEnv: 'development' | 'production' | 'safe_mode' | 'unknown_env';
          role: UserRoles;
          expectedMessage?: string;
        },
      ]
    >([
      [
        'forbids OWNER in development',
        {
          nodeEnv: 'development',
          role: UserRoles.OWNER,
          expectedMessage: 'Access with OWNER role is not allowed in this environment',
        },
      ],
      [
        'forbids OWNER in production',
        {
          nodeEnv: 'production',
          role: UserRoles.OWNER,
          expectedMessage: 'Access with OWNER role is not allowed in this environment',
        },
      ],
      [
        'forbids non-OWNER in safe_mode',
        {
          nodeEnv: 'safe_mode',
          role: UserRoles.ADMIN,
          expectedMessage: 'Safe mode is enabled. Only OWNER role can access the system.',
        },
      ],
      [
        'forbids OWNER in safe_mode due fallthrough to development/production branch',
        {
          nodeEnv: 'safe_mode',
          role: UserRoles.OWNER,
          expectedMessage: 'Access with OWNER role is not allowed in this environment',
        },
      ],
      [
        'forbids unknown NODE_ENV',
        {
          nodeEnv: 'unknown_env',
          role: UserRoles.ADMIN,
          expectedMessage: 'Unknown NODE_ENV environment',
        },
      ],
      ['allows ADMIN in development', { nodeEnv: 'development', role: UserRoles.ADMIN }],
    ])('handles %s', async (_title, params) => {
      const { nodeEnv, role, expectedMessage } = params;
      mockNodeEnv = nodeEnv;

      const guard = new TokenGuard(reflector);
      const { context } = createContextWithRequest({
        headers: { authorization: 'Bearer valid-token' },
      });

      (app.get as jest.Mock).mockReturnValue({
        tokenIntrospection: jest.fn().mockResolvedValue({
          active: true,
          client_id: 'MAIN_CLIENT',
          user_id: '10',
          tokenPermissions: ['scope.a'],
          tokenKind: 'session',
        }),
        isAuthorizeOnlyAdminsEnabled: jest.fn().mockResolvedValue(false),
      });
      (prisma.role.findUnique as jest.Mock).mockResolvedValue({
        role: role === UserRoles.OWNER ? 'OWNER' : 'ADMIN',
        user: {
          blocked: false,
          deleted: false,
          email: 'test@example.com',
        },
      });
      (convertToRoles as jest.Mock).mockReturnValue(role);

      if (expectedMessage !== undefined) {
        await expect(guard.canActivate(context)).rejects.toMatchObject({
          response: {
            message: expectedMessage,
          },
        });
      } else {
        await expect(guard.canActivate(context)).resolves.toBe(true);
      }
    });

    // Verify the authorizeOnlyAdmins branch.
    it.each<[string, UserRoles, Ei18nCodes | null, string[] | null]>([
      ['throws T3E0026 when role is not EDITOR/OWNER', UserRoles.ADMIN, Ei18nCodes.T3E0026, null],
      ['allows EDITOR when enabled', UserRoles.EDITOR, null, ['perm.editor']],
    ])('authorizeOnlyAdmins %s', async (_title, role, expectedMessage, expectedPermissions) => {
      const guard = new TokenGuard(reflector);
      const { context, request } = createContextWithRequest({
        headers: { authorization: 'Bearer valid-token' },
      });

      (app.get as jest.Mock).mockReturnValue({
        tokenIntrospection: jest.fn().mockResolvedValue({
          active: true,
          client_id: 'MAIN_CLIENT',
          user_id: '10',
          tokenPermissions: ['scope.a'],
          tokenKind: 'session',
        }),
        isAuthorizeOnlyAdminsEnabled: jest.fn().mockResolvedValue(true),
      });
      (prisma.role.findUnique as jest.Mock).mockResolvedValue({
        role: role === UserRoles.EDITOR ? 'EDITOR' : 'ADMIN',
        user: {
          blocked: false,
          deleted: false,
          email: 'test@example.com',
        },
      });
      (convertToRoles as jest.Mock).mockReturnValue(role);

      if (expectedMessage) {
        await expect(guard.canActivate(context)).rejects.toMatchObject({
          response: {
            message: expectedMessage,
          },
        });
        return;
      }

      (getPermissionsByRole as jest.Mock).mockReturnValue(expectedPermissions);
      await expect(guard.canActivate(context)).resolves.toBe(true);
      expect(request[ROLE_KEY]).toBe(role);
      expect(request.tokenPermissions).toEqual(expectedPermissions);
    });

    // Verify the auth context and client metadata for Bearer authentication.
    it('fills AUTH_CONTEXT_KEY for Bearer token', async () => {
      const guard = new TokenGuard(reflector);
      const { context, request } = createContextWithRequest({
        headers: { authorization: 'Bearer valid-token' },
      });

      (app.get as jest.Mock).mockReturnValue({
        tokenIntrospection: jest.fn().mockResolvedValue({
          active: true,
          client_id: 'MAIN_CLIENT',
          user_id: '10',
          tokenPermissions: ['perm.read', 'scope.a'],
          tokenKind: 'personal_access',
        }),
        isAuthorizeOnlyAdminsEnabled: jest.fn().mockResolvedValue(false),
      });
      (prisma.role.findUnique as jest.Mock).mockResolvedValue({
        role: 'ADMIN',
        user: {
          blocked: false,
          deleted: false,
          email: 'test@example.com',
        },
      });
      (convertToRoles as jest.Mock).mockReturnValue(UserRoles.ADMIN);
      (getPermissionsByRole as jest.Mock).mockReturnValue(['perm.read', 'perm.write']);

      await expect(guard.canActivate(context)).resolves.toBe(true);

      expect(request.tokenClientId).toBe('MAIN_CLIENT');
      expect((request as any).rawTokenPermissions).toEqual(['perm.read', 'scope.a']);
      expect((request as any)[AUTH_CONTEXT_KEY]).toMatchObject({
        userId: '10',
        tokenKind: 'personal_access',
        systemRole: UserRoles.ADMIN,
        effectiveRole: UserRoles.ADMIN,
        rawTokenPermissions: ['perm.read', 'scope.a'],
        effectivePermissions: ['perm.read'],
        tokenClientId: 'MAIN_CLIENT',
      });
    });
  });
});
