import type { Client } from '@prisma/client';
import type { IAuthByTypeParams } from '../interaction/interaction.service';
import type { UserModel } from '../repository';

export type Awaitable<T> = T | Promise<T>;

export function createCallEventName<Scope extends string, Method extends string>(
  scope: Scope,
  method: Method,
): `${Scope}.${Method}`;
export function createCallEventName<
  Scope extends string,
  Method extends string,
  Point extends string,
>(scope: Scope, method: Method, point: Point): `${Scope}.${Method}.${Point}`;
export function createCallEventName(scope: string, method: string, point?: string) {
  return [scope, method, point].filter(Boolean).join('.');
}

export const CallEventNames = {
  AuthService: {
    checkUserCredentials: createCallEventName('AuthService', 'checkUserCredentials'),
  },
  InteractionController: {
    steps: createCallEventName('InteractionController', 'steps'),
    authByType: createCallEventName('InteractionController', 'authByType'),
  },
  Organization: {
    afterCreated: createCallEventName('Organization', 'afterCreated'),
  },
  Authentication: {
    beforeByType: createCallEventName('Authentication', 'beforeByType'),
    afterAuthorized: createCallEventName('Authentication', 'afterAuthorized'),
  },
} as const;

export type AuthServiceCheckUserCredentialsPayload = {
  identifier: string;
  password: string;
  user: UserModel;
};

export type AuthServiceCheckUserCredentialsResult = {
  handled: boolean;
};

export type InteractionControllerAccessPayload = {
  client: Client;
};

export type InteractionControllerAccessResult = {
  allowed: boolean;
};

export type CallEventHandledResult = {
  handled: boolean;
};

export type OrganizationAfterCreatedPayload = {
  orgId: string;
  actorUserId: string;
};

export type AuthenticationBeforeByTypePayload = {
  params: IAuthByTypeParams;
};

export type AuthenticationAfterAuthorizedPayload = {
  client: Client;
  user: UserModel;
  authType: string;
  ip?: string | null;
  userAgent?: string | string[] | undefined;
};

export interface CallEventsContract {
  [CallEventNames.AuthService.checkUserCredentials]: {
    payload: AuthServiceCheckUserCredentialsPayload;
    result: AuthServiceCheckUserCredentialsResult;
  };
  [CallEventNames.InteractionController.steps]: {
    payload: InteractionControllerAccessPayload;
    result: InteractionControllerAccessResult;
  };
  [CallEventNames.InteractionController.authByType]: {
    payload: InteractionControllerAccessPayload;
    result: InteractionControllerAccessResult;
  };
  [CallEventNames.Organization.afterCreated]: {
    payload: OrganizationAfterCreatedPayload;
    result: CallEventHandledResult;
  };
  [CallEventNames.Authentication.beforeByType]: {
    payload: AuthenticationBeforeByTypePayload;
    result: CallEventHandledResult;
  };
  [CallEventNames.Authentication.afterAuthorized]: {
    payload: AuthenticationAfterAuthorizedPayload;
    result: CallEventHandledResult;
  };
}

export type CallEventName = keyof CallEventsContract & string;

export type CallEventPayload<Name extends CallEventName> = CallEventsContract[Name]['payload'];

export type CallEventResult<Name extends CallEventName> = CallEventsContract[Name]['result'];

export type CallEventHandler<Name extends CallEventName> = (
  payload: CallEventPayload<Name>,
) => Awaitable<CallEventResult<Name>>;

export interface CallEventHandlerEntry<Name extends CallEventName = CallEventName> {
  eventName: Name;
  methodName: string;
  targetName: string;
  handler: CallEventHandler<Name>;
}

export interface CallEventErrorEntry {
  eventName: CallEventName;
  methodName: string;
  targetName: string;
  error: unknown;
}

export class CallAggregateError extends Error {
  constructor(message: string, public readonly errors: CallEventErrorEntry[]) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'CallAggregateError';
  }
}
