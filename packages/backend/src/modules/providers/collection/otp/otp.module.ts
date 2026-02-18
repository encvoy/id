import { Module } from '@nestjs/common';
import { RepositoryModule } from 'src/modules/repository';
import { OtpService } from './otp.service';
import { HotpService } from './hotp.service';
import { OtpController } from './otp.controller';

@Module({
  imports: [RepositoryModule],
  controllers: [OtpController],
  providers: [OtpService, HotpService],
  exports: [OtpService, HotpService],
})
export class OtpModule {}
