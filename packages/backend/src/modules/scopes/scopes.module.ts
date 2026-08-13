import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { OidcScopesController } from './oidc-scopes.controller';
import { ScopesController } from './scopes.controller';
import { ScopeService } from './scopes.service';

@Module({
  imports: [RedisModule],
  controllers: [ScopesController, OidcScopesController],
  providers: [ScopeService],
  exports: [ScopeService],
})
export class ScopeModule {}
