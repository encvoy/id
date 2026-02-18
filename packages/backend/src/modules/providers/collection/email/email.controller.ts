import * as common from '@nestjs/common';
import * as swagger from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Response } from 'express';
import { Ei18nCodes } from 'src/enums';
import { showErrorWidget, showSuccessWidget } from 'src/modules/interaction/interaction.helpers';
import { REDIS_PREFIXES, RedisAdapter } from 'src/modules/redis';
import { EmailDTO, InteractionEmailDto } from './email.dto';
import { EmailService } from './email.service';

@common.Controller('')
export class EmailController {
  constructor(private readonly service: EmailService) {}

  userData = new RedisAdapter(REDIS_PREFIXES.UserData);

  @common.Get('/interaction/:uid/email/check_code')
  @swagger.ApiParam({ name: 'uid', example: 'gg-mNVXQtFNaIackQOXQ4' })
  @swagger.ApiOperation({ summary: 'Check code' })
  @swagger.ApiOkResponse()
  @common.UseGuards(ThrottlerGuard)
  async checkCode(
    @common.Param('uid') uid: string,
    @common.Query()
    { code, email }: InteractionEmailDto,
  ) {
    await this.service.checkCode(email, code);
  }

  @common.Get('/interaction/:uid/email/confirm')
  @swagger.ApiParam({ name: 'uid', example: 'gg-mNVXQtFNaIackQOXQ4' })
  @swagger.ApiOperation({ summary: 'Confirm email' })
  @swagger.ApiOkResponse()
  @common.UseGuards(ThrottlerGuard)
  async confirm(
    @common.Param('uid') uid: string,
    @common.Query()
    { code, email }: InteractionEmailDto,
  ) {
    await this.service.confirm(email, code);

    let userData = (await this.userData.find(uid)) || {};
    userData.email = email;
    await this.userData.upsert(uid, userData, 3600);
  }

  @common.Get('/v1/verification/status')
  @swagger.ApiOperation({ summary: 'Check email verification status' })
  @swagger.ApiOkResponse()
  async checkStatus(
    @common.Query()
    { email }: EmailDTO,
  ) {
    return this.service.getStatus(email);
  }

  @common.Get('/v1/verification/confirm')
  @swagger.ApiOperation({ summary: 'Confirm email verification status' })
  @swagger.ApiOkResponse()
  @common.UseGuards(ThrottlerGuard)
  async confirmStatus(
    @common.Res() res: Response,
    @common.Query()
    { email, code }: InteractionEmailDto,
  ) {
    try {
      const status = await this.service.getStatus(email);
      if (status.status) {
        return await showErrorWidget(res, Ei18nCodes.T3E0096);
      }
      await this.service.confirmStatus(email, code);
      return await showSuccessWidget(res);
    } catch (error) {
      return await showErrorWidget(res, error['message'] || Ei18nCodes.T3E0078);
    }
  }
}
