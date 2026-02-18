import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { RATE_LIMIT, RATE_LIMIT_TTL_SEC } from '../../constants';
import { ProviderFactoryModule } from '../providers/factory.module';
import { RedisModule } from '../redis/redis.module';
import { RepositoryModule } from '../repository/repository.module';
import { SettingsModule } from '../settings/settings.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

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
    RepositoryModule,
    RedisModule,
    SettingsModule,
    ProviderFactoryModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
