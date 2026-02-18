import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ErrorHandlingService } from './error.handling.service';

@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [ErrorHandlingService],
  exports: [ErrorHandlingService],
})
export class ErrorHandlingModule {}
