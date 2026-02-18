import { Module } from '@nestjs/common';
import { SessionsController } from './sessions.controller';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [RedisModule],
  controllers: [SessionsController],
})
export class SessionModule {}
