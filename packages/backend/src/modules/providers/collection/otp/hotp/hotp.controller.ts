import { Body, Controller, Get, Header, Post, Query } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { UserId } from 'src/decorators/userId.decorator';
import { Scope } from 'src/decorators/scope.decorator';
import { UsersActions } from 'src/modules/users/users.roles';
import { BaseOtpController } from '../common/base-otp.controller';
import { DisableOtpDto, OtpProviderQueryDto, RegenerateBackupCodesDto } from '../common/otp.dto';
import { HotpService } from './hotp.service';

@Controller('otp/hotp')
export class HotpController extends BaseOtpController<HotpService> {
  constructor(hotpService: HotpService) {
    super(hotpService);
  }

  @Get('setup')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Generate HOTP setup QR code' })
  @Scope(UsersActions.externalAccounts)
  async setup(@UserId() userId: string, @Query() query: OtpProviderQueryDto) {
    return super.setup(userId, query);
  }

  @Get('status')
  @ApiOperation({ summary: 'Get HOTP status for user' })
  @Scope(UsersActions.externalAccounts)
  async getStatus(@UserId() userId: string) {
    return super.getStatus(userId);
  }

  @Post('regenerate-backup-codes')
  @ApiOperation({ summary: 'Regenerate HOTP backup codes' })
  @Scope(UsersActions.externalAccounts)
  async regenerateBackupCodes(
    @UserId() userId: string,
    @Body() dto: RegenerateBackupCodesDto,
  ) {
    return super.regenerateBackupCodes(userId, dto);
  }

  @Post('disable')
  @ApiOperation({ summary: 'Disable HOTP for user' })
  @Scope(UsersActions.externalAccounts)
  async disable(@UserId() userId: string, @Body() dto: DisableOtpDto) {
    return super.disable(userId, dto);
  }
}
