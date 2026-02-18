import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { UserAgent } from 'src/decorators';
import { UserId } from 'src/decorators/userId.decorator';
import { Scope } from '../../../../decorators/scope.decorator';
import { UsersActions } from '../../../users/users.roles';
import { WebAuthnService } from './webauthn.service';

@Controller()
export class WebAuthnController {
  constructor(private readonly webauthnService: WebAuthnService) {}

  @Get('webauthn/register')
  @ApiOperation({ summary: 'Bind WebAuthn device to user account' })
  @Scope(UsersActions.externalAccounts)
  async bindDeviceToUser(
    @UserId() userId: string,
    @Query('provider_id') providerId: string,
    @UserAgent() userAgent: string,
  ) {
    return this.webauthnService.generateRegistrationOptions(userId, providerId, userAgent);
  }

  @Get('webauthn/authenticate')
  @ApiOperation({ summary: 'Authenticate WebAuthn device for user account' })
  @UseGuards(ThrottlerGuard)
  async authenticateDeviceForUser(@Query('provider_id') providerId: string) {
    return this.webauthnService.generateAuthenticationOptions(providerId);
  }
}
