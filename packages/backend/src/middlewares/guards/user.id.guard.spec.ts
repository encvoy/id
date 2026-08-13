jest.mock('../../modules/prisma/prisma.client', () => ({
  prisma: {
    role: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('../../helpers', () => ({
  convertToRoles: jest.fn((role: string) => role),
  findDtoEnv: jest.fn(() => ({})),
}));

jest.mock('../../constants', () => ({
  CLIENT_ID: 'MAIN_CLIENT',
}));

jest.mock('src/main', () => ({
  app: {
    get: jest.fn(),
  },
}));

jest.mock('src/modules/settings/settings.service', () => ({
  SettingsService: class SettingsService {},
}));

jest.mock('src/modules/settings/settings.dto', () => ({
  ESettingsNames: {
    authorize_only_admins: 'authorize_only_admins',
  },
}));

import { BadRequestException, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ROLE_KEY, USER_ID_KEY } from 'src/decorators';
import { Ei18nCodes, UserRoles } from 'src/enums';
import { convertToRoles } from '../../helpers';
import { prisma } from '../../modules/prisma/prisma.client';
import { UserIdGuard } from './user.id.guard';

type TReq = {
  headers: Record<string, string>;
  params: Record<string, string>;
  user_id?: string | null;
  role?: UserRoles;
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

describe('UserIdGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    type TCase = {
      req: Partial<TReq>;
      mutateRequest?: (request: TReq) => void;
      prismaResponses?: Array<any>;
      convertedTargetRole?: UserRoles;
      expectedResolve?: boolean;
      expectedException?: new (...args: any[]) => Error;
      expectedCode?: string;
      expectedPrismaCalls: number;
    };

    it.each<TCase>([
      // Early successful scenarios.
      { req: { params: {}, role: UserRoles.USER }, expectedResolve: true, expectedPrismaCalls: 0 },
      {
        req: { params: { user_id: undefined as any }, role: UserRoles.USER, user_id: '10' },
        expectedResolve: true,
        expectedPrismaCalls: 0,
      },
      {
        req: { params: { user_id: '' }, role: UserRoles.USER, user_id: '10' },
        expectedResolve: true,
        expectedPrismaCalls: 0,
      },
      {
        req: { params: { user_id: '10' }, role: UserRoles.USER, user_id: null },
        expectedResolve: true,
        expectedPrismaCalls: 0,
      },
      {
        req: { params: { user_id: '10' }, role: UserRoles.USER, user_id: undefined },
        expectedResolve: true,
        expectedPrismaCalls: 0,
      },
      {
        req: { params: { user_id: '99' }, role: UserRoles.OWNER, user_id: '10' },
        expectedResolve: true,
        expectedPrismaCalls: 0,
      },
      {
        req: { params: { user_id: '10' }, role: UserRoles.USER, user_id: '10' },
        expectedResolve: true,
        expectedPrismaCalls: 0,
      },
      {
        req: { params: { user_id: '11' } },
        mutateRequest: (request) => {
          request[ROLE_KEY] = UserRoles.OWNER;
          request[USER_ID_KEY] = '1';
        },
        expectedResolve: true,
        expectedPrismaCalls: 0,
      },

      // Failure scenarios.
      {
        req: { params: { user_id: '22' }, role: UserRoles.EDITOR, user_id: '10' },
        prismaResponses: [null],
        convertedTargetRole: UserRoles.USER,
        expectedException: BadRequestException,
        expectedCode: Ei18nCodes.T3E0059,
        expectedPrismaCalls: 1,
      },
      {
        req: { params: { user_id: '22' }, role: UserRoles.EDITOR, user_id: '10' },
        prismaResponses: [{ role: UserRoles.OWNER }],
        convertedTargetRole: UserRoles.OWNER,
        expectedException: ForbiddenException,
        expectedCode: Ei18nCodes.T3E0026,
        expectedPrismaCalls: 1,
      },
      {
        req: { params: { user_id: '22' }, role: UserRoles.EDITOR, user_id: '10' },
        prismaResponses: [{ role: UserRoles.USER }, null],
        convertedTargetRole: UserRoles.USER,
        expectedException: ForbiddenException,
        expectedCode: Ei18nCodes.T3E0003,
        expectedPrismaCalls: 2,
      },
      {
        req: { params: { user_id: '22' }, role: UserRoles.USER, user_id: '10' },
        prismaResponses: [{ role: UserRoles.USER }, { role: UserRoles.USER }],
        convertedTargetRole: UserRoles.USER,
        expectedException: ForbiddenException,
        expectedCode: Ei18nCodes.T3E0026,
        expectedPrismaCalls: 2,
      },

      // Successful scenario with a client ID.
      {
        req: { params: { user_id: '22', client_id: 'CL-1' }, role: UserRoles.USER, user_id: '10' },
        prismaResponses: [{ role: UserRoles.USER }],
        convertedTargetRole: UserRoles.USER,
        expectedResolve: true,
        expectedPrismaCalls: 1,
      },
    ])(
      'canActivate(req: %j, expectedResolve: $expectedResolve, expectedCode: $expectedCode)',
      async ({
        req,
        mutateRequest,
        prismaResponses,
        convertedTargetRole,
        expectedResolve,
        expectedException,
        expectedCode,
        expectedPrismaCalls,
      }) => {
        const guard = new UserIdGuard();
        const { context, request } = createContextWithRequest(req);

        if (mutateRequest) {
          mutateRequest(request);
        }

        (prismaResponses || []).forEach((response) => {
          (prisma.role.findUnique as jest.Mock).mockResolvedValueOnce(response);
        });

        if (convertedTargetRole !== undefined) {
          (convertToRoles as jest.Mock).mockReturnValue(convertedTargetRole);
        }

        const activationResult = guard.canActivate(context);

        if (expectedException && expectedCode) {
          await expect(activationResult).rejects.toThrow(expectedException);
          await expect(activationResult).rejects.toThrow(expectedCode);
        } else {
          await expect(activationResult).resolves.toBe(expectedResolve ?? true);
        }

        expect(prisma.role.findUnique).toHaveBeenCalledTimes(expectedPrismaCalls);
      },
    );
  });
});
