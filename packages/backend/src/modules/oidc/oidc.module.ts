import { Module, forwardRef } from '@nestjs/common';
import { OidcService } from './oidc.service';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [RedisModule],
  providers: [OidcService],
  exports: [OidcService],
})
export class OidcModule {}
