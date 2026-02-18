import { Module, forwardRef } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { RATE_LIMIT, RATE_LIMIT_TTL_SEC } from '../../constants';
import { InteractionController } from './interaction.controller';
import { InteractionService } from './interaction.service';
import { InteractionExceptionFilter } from '../../middlewares/exceptionFilters/interaction.exception.filter';
import { LoggerModule } from '../logger';
import { OidcModule } from '../oidc';
import { PrismaModule } from '../prisma';
import { RedisModule } from '../redis';
import { RepositoryModule } from '../repository';
import { SettingsModule } from '../settings';
import { UsersModule } from '../users';
import { ProviderFactoryModule } from '../providers/factory.module';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          limit: RATE_LIMIT,
          ttl: RATE_LIMIT_TTL_SEC,
        },
      ],
    }),
    PrismaModule,
    forwardRef(() => UsersModule),
    forwardRef(() => LoggerModule),
    forwardRef(() => OidcModule),
    SettingsModule,
    RepositoryModule,
    RedisModule,
    ProviderFactoryModule,
  ],
  controllers: [InteractionController],
  providers: [InteractionService, InteractionExceptionFilter],
  exports: [InteractionService],
})
export class InteractionModule {}
