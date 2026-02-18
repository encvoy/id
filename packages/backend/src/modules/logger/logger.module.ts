import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LoggerController } from './logger.controller';
import { CustomLogger } from './logger.service';
import { RepositoryModule } from '../repository/repository.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [PrismaModule, RepositoryModule, forwardRef(() => SettingsModule)],
  controllers: [LoggerController],
  providers: [CustomLogger],
  exports: [CustomLogger],
})
export class LoggerModule {}
