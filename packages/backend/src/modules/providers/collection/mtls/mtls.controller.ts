import { Controller, Get, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { DOMAIN } from 'src/constants';
import { Scope, UserId } from 'src/decorators';
import { Mtls, MtlsInfo } from './mtls.decorator';
import { MtlsGuard } from './mtls.guard';
import { MtlsService } from './mtls.service';
import { UsersActions } from 'src/modules/users/users.roles';

@ApiTags('mTLS')
@UseGuards(MtlsGuard)
@Controller()
export class MtlsController {
  constructor(private readonly mtlsService: MtlsService) {}

  @Get('mtls/auth')
  @ApiOperation({ summary: 'mTLS Authentication Endpoint for OIDC flow' })
  async authenticateWithCertificate(
    @Res() res: Response,
    @Mtls() mtlsInfo: MtlsInfo,
    @Query('uid') uid: string,
    @Query('provider_id') providerId: string,
  ) {
    const state = await this.mtlsService.initiateAuth(providerId, mtlsInfo);
    const redirectUrl = `${DOMAIN}/api/interaction/${uid}/auth?type=MTLS&provider_id=${providerId}&state=${state}`;
    return res.redirect(redirectUrl);
  }

  @Post('mtls/bind')
  @ApiOperation({ summary: 'Bind mTLS certificate to user account' })
  @Scope(UsersActions.externalAccounts)
  async bindCertificateToUser(
    @UserId() userId: string,
    @Mtls() mtlsInfo: MtlsInfo,
    @Query('provider_id') providerId?: string,
  ) {
    const state = await this.mtlsService.initiateBind(userId, providerId, mtlsInfo);
    return { state };
  }
}
