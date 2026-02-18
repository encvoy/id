import { Module, forwardRef } from '@nestjs/common';
import { OidcService } from './oidc.service';
import { LoggerModule } from '../logger/logger.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [forwardRef(() => LoggerModule), RedisModule],
  providers: [OidcService],
  exports: [OidcService],
})
export class OidcModule {}
