import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger/dist';
import { Response } from 'express';
import { UserId } from 'src/decorators';
import * as dto from './auth.dto';
import { AuthService } from './auth.service';

@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('/oauth')
  @ApiOperation({ summary: 'Start OAuth authorization' })
  async initiateOauth(
    @Res() res: Response,
    @Query() query: dto.InitiateOauthDto,
    @UserId() userId?: string,
  ) {
    let url = await this.authService.initiateOauth(query, userId);
    if (query.return_url) {
      return res.status(200).send({ url });
    }
    return res.redirect(url);
  }

  @Post('/check_identifier')
  @ApiOperation({ summary: 'Find identifier in system' })
  async checkIdentifier(@Body() checkIdentifierDto: dto.CheckIdentifierDto) {
    return this.authService.checkUserIdentifier(
      checkIdentifierDto.identifier,
      checkIdentifierDto.login,
    );
  }
}
