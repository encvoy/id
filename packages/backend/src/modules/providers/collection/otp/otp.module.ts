import { Module } from '@nestjs/common';
import { OidcModule } from 'src/modules/oidc/oidc.module';
import { RepositoryModule } from 'src/modules/repository/repository.module';
import { InteractionOtpController } from './otp.controller';
import { HotpController } from './hotp/hotp.controller';
import { HotpService } from './hotp/hotp.service';
import { TotpController } from './totp/totp.controller';
import { TotpService } from './totp/totp.service';

@Module({
  imports: [RepositoryModule, OidcModule],
  controllers: [TotpController, HotpController, InteractionOtpController],
  providers: [TotpService, HotpService],
  exports: [TotpService, HotpService],
})
export class OtpModule {}
