import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { ScopesController } from './scopes.controller';
import { ScopeService } from './scopes.service';

@Module({
  imports: [RedisModule],
  controllers: [ScopesController],
  providers: [ScopeService],
  exports: [ScopeService],
})
export class ScopeModule {}
