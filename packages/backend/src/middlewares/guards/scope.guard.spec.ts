import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SCOPE_KEY } from 'src/decorators';
import { AUTH_CONTEXT_KEY } from 'src/request-auth';
import { ScopeGuard } from './scope.guard';

type TCaseRequest = {
  tokenPermissions?: unknown;
  [AUTH_CONTEXT_KEY]?: {
    effectivePermissions?: unknown;
  };
};

const createContext = (request: TCaseRequest): ExecutionContext => {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => ({} as any),
  } as ExecutionContext;
};

describe('ScopeGuard', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it.each<[string, string | undefined, TCaseRequest, boolean]>([
    ['allows when scope is not required', undefined, {}, true],
    [
      'allows when effectivePermissions includes required scope',
      'scope.read',
      {
        [AUTH_CONTEXT_KEY]: {
          effectivePermissions: ['scope.read', 'scope.write'],
        },
      },
      true,
    ],
    [
      'denies when effectivePermissions does not include required scope',
      'scope.admin',
      {
        [AUTH_CONTEXT_KEY]: {
          effectivePermissions: ['scope.read', 'scope.write'],
        },
      },
      false,
    ],
    [
      'falls back to tokenPermissions when effectivePermissions is undefined',
      'scope.write',
      {
        [AUTH_CONTEXT_KEY]: {},
        tokenPermissions: ['scope.write'],
      },
      true,
    ],
    [
      'denies when effectivePermissions has invalid non-array type even if tokenPermissions includes scope',
      'scope.write',
      {
        [AUTH_CONTEXT_KEY]: {
          effectivePermissions: 'scope.write',
        },
        tokenPermissions: ['scope.write'],
      },
      false,
    ],
    [
      'denies when both effectivePermissions and tokenPermissions are absent',
      'scope.read',
      {},
      false,
    ],
    [
      'denies when tokenPermissions has invalid non-array type',
      'scope.read',
      {
        tokenPermissions: 'scope.read',
      },
      false,
    ],
  ])('canActivate: %s', async (_title, requiredScope, request, expected) => {
    const getSpy = jest.spyOn(Reflector.prototype, 'get').mockReturnValue(requiredScope as any);
    const guard = new ScopeGuard();
    const context = createContext(request);

    await expect(guard.canActivate(context)).resolves.toBe(expected);
    expect(getSpy).toHaveBeenCalledWith(SCOPE_KEY, expect.anything());
  });
});
