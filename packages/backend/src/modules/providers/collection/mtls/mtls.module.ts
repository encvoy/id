import { Module } from '@nestjs/common';
import { MtlsController } from './mtls.controller';
import { MtlsService } from './mtls.service';

@Module({
  controllers: [MtlsController],
  providers: [MtlsService],
  exports: [MtlsService],
})
export class MtlsModule {}
