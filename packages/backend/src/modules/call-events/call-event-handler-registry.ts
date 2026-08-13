import { Injectable } from '@nestjs/common';
import { CallEventHandlerEntry, CallEventName } from './types';

@Injectable()
export class CallEventHandlerRegistry {
  private readonly handlers = new Map<string, CallEventHandlerEntry[]>();

  public clear() {
    this.handlers.clear();
  }

  public register(handler: CallEventHandlerEntry) {
    const key = handler.eventName.trim();
    if (!key) {
      return;
    }

    const currentHandlers = this.handlers.get(key) || [];
    const isAlreadyRegistered = currentHandlers.some(
      (item) =>
        item.methodName === handler.methodName && item.targetName === handler.targetName,
    );

    if (isAlreadyRegistered) {
      return;
    }

    this.handlers.set(key, [...currentHandlers, handler]);
  }

  public get(eventName: CallEventName): CallEventHandlerEntry[] {
    return this.handlers.get(eventName.trim()) || [];
  }

  public getEventNames(): CallEventName[] {
    return [...this.handlers.keys()] as CallEventName[];
  }
}
