import { Module } from '@nestjs/common';
import { EmailCustomService } from './emailc.service';

@Module({
  providers: [EmailCustomService],
  exports: [EmailCustomService],
})
export class EmailCustomModule {}
