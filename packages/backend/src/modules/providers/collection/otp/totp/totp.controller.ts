import { Body, Controller, Get, Header, Post, Query } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { UserId } from 'src/decorators/userId.decorator';
import { Scope } from 'src/decorators/scope.decorator';
import { UsersActions } from 'src/modules/users/users.roles';
import { BaseOtpController } from '../common/base-otp.controller';
import { DisableOtpDto, OtpProviderQueryDto, RegenerateBackupCodesDto } from '../common/otp.dto';
import { TotpService } from './totp.service';

@Controller('otp/totp')
export class TotpController extends BaseOtpController<TotpService> {
  constructor(totpService: TotpService) {
    super(totpService);
  }

  @Get('setup')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Generate TOTP setup QR code' })
  @Scope(UsersActions.externalAccounts)
  async setup(@UserId() userId: string, @Query() query: OtpProviderQueryDto) {
    return super.setup(userId, query);
  }

  @Get('status')
  @ApiOperation({ summary: 'Get TOTP status for user' })
  @Scope(UsersActions.externalAccounts)
  async getStatus(@UserId() userId: string) {
    return super.getStatus(userId);
  }

  @Post('regenerate-backup-codes')
  @ApiOperation({ summary: 'Regenerate TOTP backup codes' })
  @Scope(UsersActions.externalAccounts)
  async regenerateBackupCodes(
    @UserId() userId: string,
    @Body() dto: RegenerateBackupCodesDto,
  ) {
    return super.regenerateBackupCodes(userId, dto);
  }

  @Post('disable')
  @ApiOperation({ summary: 'Disable TOTP for user' })
  @Scope(UsersActions.externalAccounts)
  async disable(@UserId() userId: string, @Body() dto: DisableOtpDto) {
    return super.disable(userId, dto);
  }
}
