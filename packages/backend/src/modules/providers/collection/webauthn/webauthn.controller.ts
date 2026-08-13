import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';
import { UserAgent } from 'src/decorators';
import { UserId } from 'src/decorators/userId.decorator';
import { WebAuthnService } from './webauthn.service';

@Controller()
export class WebAuthnController {
  constructor(private readonly webauthnService: WebAuthnService) {}

  @Get('webauthn/register')
  @ApiOperation({ summary: 'Bind WebAuthn device to user account' })
  @UseGuards(ThrottlerGuard)
  async bindDeviceToUser(
    @UserId() userId: string,
    @Query('provider_id') providerId: string,
    @Query('interaction_id') interactionId: string,
    @UserAgent() userAgent: string,
    @Req() req: Request,
  ) {
    return this.webauthnService.generateRegistrationOptions(
      userId,
      providerId,
      userAgent,
      req.cookies?.required_accounts_info_uid,
      interactionId,
      req.cookies?._req_ids,
    );
  }

  @Get('webauthn/authenticate')
  @ApiOperation({ summary: 'Authenticate WebAuthn device for user account' })
  @UseGuards(ThrottlerGuard)
  async authenticateDeviceForUser(@Query('provider_id') providerId: string) {
    return this.webauthnService.generateAuthenticationOptions(providerId);
  }
}
