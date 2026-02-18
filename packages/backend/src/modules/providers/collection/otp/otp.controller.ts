import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { UserId } from 'src/decorators/userId.decorator';
import { Scope } from '../../../../decorators/scope.decorator';
import { UsersActions } from '../../../users/users.roles';
import { ConfirmTOTPSetupDto, DisableTOTPDto, RegenerateBackupCodesDto } from './otp.dto';
import { OtpService } from './otp.service';

@Controller('otp')
export class OtpController {
  constructor(private readonly totpService: OtpService) {}

  @Get('setup')
  @ApiOperation({ summary: 'Generate OTP setup QR code' })
  @Scope(UsersActions.externalAccounts)
  async setupTOTP(@UserId() userId: string, @Query('app_name') appName?: string) {
    return this.totpService.generateTOTPSetup(userId, appName);
  }

  @Post('confirm-setup')
  @ApiOperation({ summary: 'Confirm OTP setup with verification code' })
  @Scope(UsersActions.externalAccounts)
  async confirmSetup(@UserId() userId: string, @Body() dto: ConfirmTOTPSetupDto) {
    return this.totpService.confirmTOTPSetup(userId, dto.token);
  }

  @Get('status')
  @ApiOperation({ summary: 'Get OTP status for user' })
  @Scope(UsersActions.externalAccounts)
  async getStatus(@UserId() userId: string) {
    return this.totpService.getTOTPStatus(userId);
  }

  @Post('regenerate-backup-codes')
  @ApiOperation({ summary: 'Regenerate backup codes' })
  @Scope(UsersActions.externalAccounts)
  async regenerateBackupCodes(@UserId() userId: string, @Body() dto: RegenerateBackupCodesDto) {
    return this.totpService.regenerateBackupCodes(userId, dto.token);
  }

  @Post('disable')
  @ApiOperation({ summary: 'Disable OTP for user' })
  @Scope(UsersActions.externalAccounts)
  async disable(@UserId() userId: string, @Body() dto: DisableTOTPDto) {
    return this.totpService.disableTOTP(userId, dto.token);
  }
}
