import { Module, forwardRef } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { RATE_LIMIT, RATE_LIMIT_TTL_SEC } from '../../constants';
import { InteractionController } from './interaction.controller';
import { InteractionService } from './interaction.service';
import { InteractionExceptionFilter } from '../../middlewares/exceptionFilters/interaction.exception.filter';
import { NotificationsModule } from '../notifications/notifications.module';
import { OidcModule } from '../oidc/oidc.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { RepositoryModule } from '../repository/repository.module';
import { SettingsModule } from '../settings/settings.module';
import { SentryModule } from '../sentry/sentry.module';
import { UsersModule } from '../users/users.module';
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
    forwardRef(() => OidcModule),
    NotificationsModule,
    SettingsModule,
    SentryModule,
    RepositoryModule,
    RedisModule,
    ProviderFactoryModule,
  ],
  controllers: [InteractionController],
  providers: [InteractionService, InteractionExceptionFilter],
  exports: [InteractionService],
})
export class InteractionModule {}
