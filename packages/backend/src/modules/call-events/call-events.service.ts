import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { getCallEventNames } from './call.decorator';
import { CallEventHandlerRegistry } from './call-event-handler-registry';
import {
  CallAggregateError,
  CallEventErrorEntry,
  CallEventHandlerEntry,
  CallEventName,
  CallEventPayload,
  CallEventResult,
} from './types';

@Injectable()
export class CallEventsService implements OnApplicationBootstrap {
  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly handlerRegistry: CallEventHandlerRegistry,
  ) {}

  onApplicationBootstrap() {
    this.registerDiscoveredHandlers();
  }

  public registerDiscoveredHandlers() {
    this.handlerRegistry.clear();

    for (const wrapper of this.discoveryService.getProviders()) {
      if (!wrapper?.instance || !wrapper?.metatype) {
        continue;
      }

      this.registerHandlersFromInstance(
        wrapper.instance,
        wrapper.metatype.name || wrapper.name || 'AnonymousProvider',
      );
    }
  }

  public registerHandlersFromInstance(instance: object, targetName = instance.constructor.name) {
    const visitedMethods = new Set<string | symbol>();
    let proto = Object.getPrototypeOf(instance);

    while (proto && proto !== Object.prototype) {
      for (const methodName of Object.getOwnPropertyNames(proto)) {
        if (methodName === 'constructor' || visitedMethods.has(methodName)) {
          continue;
        }

        visitedMethods.add(methodName);
        const eventNames = getCallEventNames(proto, methodName);

        if (!eventNames.length) {
          continue;
        }

        const method = (instance as Record<string, unknown>)[methodName];
        if (typeof method !== 'function') {
          continue;
        }

        for (const eventName of eventNames) {
          const handler: CallEventHandlerEntry = {
            eventName,
            methodName,
            targetName,
            handler: method.bind(instance),
          };
          this.handlerRegistry.register(handler);
        }
      }

      proto = Object.getPrototypeOf(proto);
    }
  }

  public async call<Name extends CallEventName>(
    eventName: Name,
    payload: CallEventPayload<Name>,
  ): Promise<CallEventResult<Name>[]> {
    const handlers = this.handlerRegistry.get(eventName);
    if (!handlers.length) {
      return [];
    }

    const results: CallEventResult<Name>[] = [];
    const errors: CallEventErrorEntry[] = [];

    for (const handler of handlers) {
      try {
        const result = await handler.handler(payload);
        results.push(result as CallEventResult<Name>);

        if (
          typeof result === 'object' &&
          result !== null &&
          'handled' in result &&
          Boolean((result as { handled?: unknown }).handled)
        ) {
          return results;
        }
      } catch (error) {
        errors.push({
          eventName: handler.eventName,
          methodName: handler.methodName,
          targetName: handler.targetName,
          error,
        });
      }
    }

    if (errors.length === 1) {
      throw errors[0].error;
    }

    if (errors.length) {
      const details = errors
        .map(
          ({ targetName, methodName, error }) =>
            `${targetName}.${methodName}: ${
              error instanceof Error ? error.message : String(error)
            }`,
        )
        .join('; ');
      throw new CallAggregateError(`Event "${eventName}" failed: ${details}`, errors);
    }

    return results;
  }
}
