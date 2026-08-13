import 'reflect-metadata';
import { CallEventName } from './types';

export const CALL_EVENT_METADATA = 'events:call';

const normalizeEventName = (eventName: string) => eventName.trim();

type CallEventNameInput<Name extends CallEventName> = Name | readonly Name[];

export function call<Name extends CallEventName>(eventName: CallEventNameInput<Name>): MethodDecorator {
  const normalizedEventNames = (Array.isArray(eventName) ? eventName : [eventName])
    .map(normalizeEventName)
    .filter(Boolean);

  return (target, propertyKey) => {
    const existingMetadata = Reflect.getMetadata(
      CALL_EVENT_METADATA,
      target,
      propertyKey,
    ) as string[] | string | undefined;
    const existingEventNames = Array.isArray(existingMetadata)
      ? existingMetadata
      : existingMetadata
        ? [existingMetadata]
        : [];

    const nextEventNames = Array.from(new Set([...existingEventNames, ...normalizedEventNames]));

    Reflect.defineMetadata(CALL_EVENT_METADATA, nextEventNames, target, propertyKey);
  };
}

export function getCallEventNames(
  target: object,
  propertyKey: string | symbol,
): CallEventName[] {
  const eventNames = Reflect.getMetadata(CALL_EVENT_METADATA, target, propertyKey);

  if (!eventNames) {
    return [];
  }

  return (Array.isArray(eventNames) ? eventNames : [eventNames]).filter(Boolean);
}
