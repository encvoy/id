import { Global, Module } from '@nestjs/common';
import { LoggerController } from './logger.controller';
import { CustomLogger } from './logger.service';

@Global()
@Module({
  controllers: [LoggerController],
  providers: [CustomLogger],
  exports: [CustomLogger],
})
export class LoggerModule {}
