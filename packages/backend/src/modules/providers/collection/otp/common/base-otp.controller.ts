import { BaseOtpService } from './base-otp.service';
import { DisableOtpDto, OtpProviderQueryDto, RegenerateBackupCodesDto } from './otp.dto';

export abstract class BaseOtpController<TService extends BaseOtpService = BaseOtpService> {
  constructor(protected readonly otpService: TService) {}

  protected setup(userId: string, query: OtpProviderQueryDto) {
    return this.otpService.generateSetup(userId, query.provider_id);
  }

  protected getStatus(userId: string) {
    return this.otpService.getUserOtpStatus(userId);
  }

  protected regenerateBackupCodes(userId: string, dto: RegenerateBackupCodesDto) {
    return this.otpService.regenerateUserBackupCodes(userId, dto.token);
  }

  protected disable(userId: string, dto: DisableOtpDto) {
    return this.otpService.disableUserOtp(userId, dto.token);
  }
}
