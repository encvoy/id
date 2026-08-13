jest.mock('../../modules/prisma/prisma.client', () => ({
  prisma: {
    role: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    client: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('../../helpers', () => ({
  convertToRoles: jest.fn((role: string) => role),
  findDtoEnv: jest.fn(() => ({})),
}));

import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ROLE_KEY, USER_ID_KEY } from 'src/decorators';
import { Ei18nCodes, UserRoles } from 'src/enums';
import { AUTH_CONTEXT_KEY } from 'src/request-auth';
import { convertToRoles } from '../../helpers';
import { prisma } from '../../modules/prisma/prisma.client';
import { ClientIdGuard } from './client.id.guard';

type TReq = {
  headers: Record<string, string>;
  params: Record<string, string>;
  user_id?: string | null;
  role?: UserRoles;
  tokenPermissions?: string[];
};

const createContextWithRequest = (
  req: Partial<TReq>,
): { context: ExecutionContext; request: TReq } => {
  const request: TReq = {
    headers: {},
    params: {},
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

describe('ClientIdGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    type TCase = {
      req: Partial<TReq>;
      mutateRequest?: (request: TReq & Record<string, any>) => void;
      arrange?: () => void;
      expectedResolve?: boolean;
      expectedErrorCode?: Ei18nCodes;
      expectedRole?: UserRoles;
      expectedRoleFindUniqueCalls?: number;
      expectedRoleFindFirstCalls?: number;
      expectedClientFindUniqueCalls?: number;
      expectAuthContext?: boolean;
    };

    it.each<TCase>([
      {
        req: {},
        expectedResolve: true,
        expectedRoleFindUniqueCalls: 0,
        expectedClientFindUniqueCalls: 0,
        expectedRoleFindFirstCalls: 0,
      },
      { req: { params: {}, user_id: '1', role: UserRoles.USER }, expectedResolve: true },
      {
        req: { params: { client_id: '' }, user_id: '1', role: UserRoles.USER },
        expectedResolve: true,
      },
      {
        req: { params: { client_id: 'cl1' }, user_id: null, role: UserRoles.USER },
        expectedResolve: true,
      },
      {
        req: { params: { client_id: 'cl1' }, user_id: undefined, role: UserRoles.USER },
        expectedResolve: true,
      },
      {
        req: { params: { client_id: 'cl1' }, user_id: undefined, role: undefined },
        expectedResolve: true,
      },
      {
        req: { params: { client_id: 'cl1' }, user_id: '', role: UserRoles.USER },
        expectedResolve: true,
      },
      {
        req: { params: { client_id: 'cl1' }, user_id: '1', role: UserRoles.OWNER },
        expectedResolve: true,
      },
      {
        req: { params: { client_id: 'cl1' }, user_id: '1', role: UserRoles.EDITOR },
        expectedResolve: true,
      },
      {
        req: {
          params: { client_id: 'cl1' },
          user_id: '1',
          role: UserRoles.EDITOR,
          headers: { authorization: 'Bearer token' },
        },
        mutateRequest: (request) => {
          request[AUTH_CONTEXT_KEY] = {
            rawTokenPermissions: ['perm.read'],
            tokenKind: 'bearer',
          };
        },
        expectedResolve: true,
        expectAuthContext: true,
      },
      {
        req: { params: { client_id: 'cl1', user_id: '' }, user_id: '1', role: UserRoles.USER },
        arrange: () => {
          (prisma.role.findUnique as jest.Mock).mockResolvedValueOnce({ role: UserRoles.EDITOR });
          (convertToRoles as jest.Mock).mockReturnValue(UserRoles.EDITOR);
          (prisma.client.findUnique as jest.Mock).mockResolvedValueOnce({
            client_id: 'cl1',
            authorize_only_admins: false,
            authorize_only_employees: false,
          });
        },
        expectedResolve: true,
        expectedRole: UserRoles.EDITOR,
        expectedRoleFindUniqueCalls: 1,
      },
      {
        req: {
          params: { client_id: 'cl1', user_id: undefined } as any,
          user_id: '1',
          role: UserRoles.USER,
        },
        arrange: () => {
          (prisma.role.findUnique as jest.Mock).mockResolvedValueOnce({ role: UserRoles.EDITOR });
          (convertToRoles as jest.Mock).mockReturnValue(UserRoles.EDITOR);
          (prisma.client.findUnique as jest.Mock).mockResolvedValueOnce({
            client_id: 'cl1',
            authorize_only_admins: false,
            authorize_only_employees: false,
          });
        },
        expectedResolve: true,
        expectedRole: UserRoles.EDITOR,
        expectedRoleFindUniqueCalls: 1,
      },
      {
        req: { params: { client_id: 'cl1' }, user_id: '1', role: UserRoles.USER },
        arrange: () => {
          (prisma.role.findUnique as jest.Mock).mockResolvedValueOnce(null);
        },
        expectedErrorCode: Ei18nCodes.T3E0026,
      },
      {
        req: { params: { client_id: 'cl1' }, user_id: '1', role: UserRoles.USER },
        arrange: () => {
          (prisma.role.findUnique as jest.Mock).mockResolvedValueOnce({ role: UserRoles.USER });
          (convertToRoles as jest.Mock).mockReturnValue(UserRoles.USER);
          (prisma.client.findUnique as jest.Mock).mockResolvedValueOnce(null);
        },
        expectedErrorCode: Ei18nCodes.T3E0071,
      },
      {
        req: { params: { client_id: 'cl1' }, user_id: '1', role: UserRoles.USER },
        arrange: () => {
          (prisma.role.findUnique as jest.Mock).mockResolvedValueOnce({ role: UserRoles.USER });
          (convertToRoles as jest.Mock).mockReturnValue(UserRoles.USER);
          (prisma.client.findUnique as jest.Mock).mockResolvedValueOnce({
            client_id: 'cl1',
            authorize_only_admins: true,
            authorize_only_employees: false,
          });
        },
        expectedErrorCode: Ei18nCodes.T3E0026,
      },
      {
        req: { params: { client_id: 'cl1' }, user_id: '1', role: UserRoles.USER },
        arrange: () => {
          (prisma.role.findUnique as jest.Mock).mockResolvedValueOnce({ role: UserRoles.EDITOR });
          (convertToRoles as jest.Mock).mockReturnValue(UserRoles.EDITOR);
          (prisma.client.findUnique as jest.Mock).mockResolvedValueOnce({
            client_id: 'cl1',
            authorize_only_admins: false,
            authorize_only_employees: true,
          });
          (prisma.role.findFirst as jest.Mock).mockResolvedValueOnce(null);
        },
        expectedErrorCode: Ei18nCodes.T3E0026,
      },
      {
        req: { params: { client_id: 'cl1', user_id: '22' }, user_id: '1', role: UserRoles.USER },
        arrange: () => {
          (prisma.role.findUnique as jest.Mock)
            .mockResolvedValueOnce({ role: UserRoles.EDITOR })
            .mockResolvedValueOnce(null);
          (convertToRoles as jest.Mock).mockReturnValue(UserRoles.EDITOR);
          (prisma.client.findUnique as jest.Mock).mockResolvedValueOnce({
            client_id: 'cl1',
            authorize_only_admins: false,
            authorize_only_employees: false,
          });
        },
        expectedErrorCode: Ei18nCodes.T3E0003,
      },
      {
        req: { params: { client_id: 'cl1', user_id: '22' }, user_id: '1', role: UserRoles.USER },
        arrange: () => {
          (prisma.role.findUnique as jest.Mock)
            .mockResolvedValueOnce({ role: UserRoles.USER })
            .mockResolvedValueOnce({ role: UserRoles.USER });
          (convertToRoles as jest.Mock).mockReturnValue(UserRoles.USER);
          (prisma.client.findUnique as jest.Mock).mockResolvedValueOnce({
            client_id: 'cl1',
            authorize_only_admins: false,
            authorize_only_employees: false,
          });
        },
        expectedErrorCode: Ei18nCodes.T3E0026,
      },
      {
        req: { params: { client_id: 'cl1', user_id: '22' }, user_id: '1', role: UserRoles.USER },
        arrange: () => {
          (prisma.role.findUnique as jest.Mock)
            .mockResolvedValueOnce({ role: UserRoles.EDITOR })
            .mockResolvedValueOnce({ role: UserRoles.USER });
          (convertToRoles as jest.Mock).mockReturnValue(UserRoles.EDITOR);
          (prisma.client.findUnique as jest.Mock).mockResolvedValueOnce({
            client_id: 'cl1',
            authorize_only_admins: false,
            authorize_only_employees: false,
          });
        },
        expectedResolve: true,
        expectedRole: UserRoles.EDITOR,
        expectedRoleFindUniqueCalls: 2,
      },
      {
        req: { params: { client_id: 'cl1', user_id: '22' } },
        mutateRequest: (request) => {
          request[USER_ID_KEY] = '1';
          request[ROLE_KEY] = UserRoles.EDITOR;
        },
        expectedResolve: true,
        expectedRoleFindUniqueCalls: 0,
      },
      {
        req: { params: { client_id: 'cl1' }, user_id: '1', role: UserRoles.USER },
        mutateRequest: (request) => {
          request[AUTH_CONTEXT_KEY] = {
            rawTokenPermissions: ['perm.read'],
            tokenKind: 'bearer',
          };
        },
        arrange: () => {
          (prisma.role.findUnique as jest.Mock).mockResolvedValueOnce({ role: UserRoles.EDITOR });
          (convertToRoles as jest.Mock).mockReturnValue(UserRoles.EDITOR);
          (prisma.client.findUnique as jest.Mock).mockResolvedValueOnce({
            client_id: 'cl1',
            authorize_only_admins: false,
            authorize_only_employees: false,
          });
        },
        expectedResolve: true,
        expectedRole: UserRoles.EDITOR,
        expectAuthContext: true,
      },
      {
        req: {
          params: { client_id: 'cl1' },
          user_id: '1',
          role: UserRoles.EDITOR,
          headers: { authorization: 'Bearer token' },
        },
        mutateRequest: (request) => {
          request[AUTH_CONTEXT_KEY] = {
            rawTokenPermissions: undefined,
            tokenKind: undefined,
          };
        },
        expectedResolve: true,
        expectAuthContext: true,
      },
    ])(
      'canActivate(req: %j, expectedResolve: $expectedResolve, expectedError: $expectedErrorCode)',
      async ({
        req,
        mutateRequest,
        arrange,
        expectedResolve,
        expectedErrorCode,
        expectedRole,
        expectedRoleFindUniqueCalls,
        expectedRoleFindFirstCalls,
        expectedClientFindUniqueCalls,
        expectAuthContext,
      }) => {
        const guard = new ClientIdGuard();
        const { context, request } = createContextWithRequest(req);

        mutateRequest?.(request as TReq & Record<string, any>);
        arrange?.();

        const activationResult = guard.canActivate(context);

        if (expectedErrorCode) {
          await expect(activationResult).rejects.toThrow(ForbiddenException);
          await expect(activationResult).rejects.toThrow(expectedErrorCode);
          return;
        }

        await expect(activationResult).resolves.toBe(expectedResolve ?? true);

        if (expectedRole !== undefined) {
          expect(request[ROLE_KEY]).toBe(expectedRole);
        }
        if (expectedRoleFindUniqueCalls !== undefined) {
          expect(prisma.role.findUnique).toHaveBeenCalledTimes(expectedRoleFindUniqueCalls);
        }
        if (expectedRoleFindFirstCalls !== undefined) {
          expect(prisma.role.findFirst).toHaveBeenCalledTimes(expectedRoleFindFirstCalls);
        }
        if (expectedClientFindUniqueCalls !== undefined) {
          expect(prisma.client.findUnique).toHaveBeenCalledTimes(expectedClientFindUniqueCalls);
        }
        if (expectAuthContext) {
          expect(request[AUTH_CONTEXT_KEY].targetClientId).toBe('cl1');
          expect(request[AUTH_CONTEXT_KEY].effectiveRole).toBe(request[ROLE_KEY]);
          expect(request[AUTH_CONTEXT_KEY].effectivePermissions).toEqual(request.tokenPermissions);
        }
      },
    );
  });
});
