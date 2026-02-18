import * as common from '@nestjs/common';
import * as swagger from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ConfirmPhoneNumberDTO } from './phone.dto';
import { PhoneService } from './phone.service';
import { RedisAdapter, REDIS_PREFIXES } from 'src/modules/redis';

@common.Controller('')
export class PhoneController {
  constructor(private readonly service: PhoneService) {}

  userData = new RedisAdapter(REDIS_PREFIXES.UserData);

  @common.Get('/interaction/:uid/phone/check_code')
  @swagger.ApiParam({ name: 'uid', example: 'gg-mNVXQtFNaIackQOXQ4' })
  @swagger.ApiOperation({ summary: 'Check code' })
  @swagger.ApiConsumes('application/x-www-form-urlencoded')
  @swagger.ApiOkResponse()
  @common.UseGuards(ThrottlerGuard)
  async checkCode(
    @common.Param('uid') uid: string,
    @common.Query()
    { code, phone_number }: ConfirmPhoneNumberDTO,
  ) {
    await this.service.checkCode(phone_number, code);
  }

  @common.Post('/interaction/:uid/phone/confirm')
  @swagger.ApiParam({ name: 'uid', example: 'gg-mNVXQtFNaIackQOXQ4' })
  @swagger.ApiOperation({ summary: 'Confirm phone number' })
  @swagger.ApiOkResponse()
  @common.UseGuards(ThrottlerGuard)
  async confirm(@common.Param('uid') uid: string, @common.Body() body: ConfirmPhoneNumberDTO) {
    await this.service.confirm(body.phone_number, body.code);

    let userData = (await this.userData.find(uid)) || {};
    userData.phone_number = body.phone_number;
    await this.userData.upsert(uid, userData, 3600);
  }
}
