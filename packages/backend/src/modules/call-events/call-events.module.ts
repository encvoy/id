import { Global, Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { CallEventsService } from './call-events.service';
import { CallEventHandlerRegistry } from './call-event-handler-registry';

@Global()
@Module({
  imports: [DiscoveryModule],
  providers: [CallEventHandlerRegistry, CallEventsService],
  exports: [CallEventHandlerRegistry, CallEventsService],
})
export class CallEventsModule {}
