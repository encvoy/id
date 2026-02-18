import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from 'src/modules/prisma';
import { RATE_LIMIT, RATE_LIMIT_TTL_SEC } from '../../../../constants';
import { EthereumController } from './ethereum.controller';
import { EthereumService } from './ethereum.service';

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
  ],
  controllers: [EthereumController],
  providers: [EthereumService],
  exports: [EthereumService],
})
export class EthereumModule {}
