import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Request } from 'express';

@Injectable()
export class ErrorHandlingService {
  constructor(private eventEmitter: EventEmitter2) {}

  async handleError(error: any, userId?: string, request?: Request) {
    this.eventEmitter.emit('error.handled', { error, userId, request });
  }

  async onError(listener: (error: any, userId?: string, request?: Request) => void) {
    this.eventEmitter.on('error.handled', listener);
  }
}
