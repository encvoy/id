import { BadRequestException, ExecutionContext } from '@nestjs/common';
import { UidNotUndefinedGuard } from './uid.guard';

type TReq = {
  params: {
    uid?: string | null;
  };
  headers: Record<string, unknown>;
};

const createContext = (request: Partial<TReq>): ExecutionContext => {
  const req: TReq = {
    params: {},
    headers: {},
    ...request,
  } as TReq;

  return {
    switchToHttp: () => ({
      getRequest: () => req,
    }),
  } as ExecutionContext;
};

describe('UidNotUndefinedGuard', () => {
  it.each<[Partial<TReq>, boolean, string | null]>([
    [{ params: {}, headers: {} }, true, null],
    [{ params: { uid: '123' }, headers: {} }, true, null],
    [{ params: { uid: 'undefined' }, headers: { rsc: '1' } }, false, null],
    [{ params: { uid: 'undefined' }, headers: { 'next-router-state-tree': 'tree' } }, false, null],
    [{ params: { uid: 'undefined' }, headers: {} }, false, 'Invalid uid'],
    [{ params: { uid: null }, headers: {} }, false, 'Invalid uid'],
    [{ params: { uid: '' }, headers: {} }, false, 'Invalid uid'],
    [{ params: { uid: 'undefined' }, headers: { rsc: '' } }, false, 'Invalid uid'],
  ])(
    'canActivate(input=%j, expectedResult=%j, expectedError=%j)',
    (request, expectedResult, expectedErrorMessage) => {
      const guard = new UidNotUndefinedGuard();
      const context = createContext(request);

      if (expectedErrorMessage) {
        expect(() => guard.canActivate(context)).toThrow(BadRequestException);
        expect(() => guard.canActivate(context)).toThrow(expectedErrorMessage);
        return;
      }

      expect(guard.canActivate(context)).toBe(expectedResult);
    },
  );
});
