import { Request, Response } from 'express';
import * as common from '@nestjs/common';
import * as swagger from '@nestjs/swagger';
import { Scope } from '../../decorators';
import { RedisAdapter } from '../redis/redis.adapter';
import Cookies from 'cookies';
import { SessionsActions } from './sessions.roles';

@common.Controller('v1')
@swagger.ApiBasicAuth()
@swagger.ApiBearerAuth()
export class SessionsController {
  constructor(private readonly redis: RedisAdapter) {}

  @common.Delete('users/:user_id/sessions')
  @common.HttpCode(common.HttpStatus.NO_CONTENT)
  @swagger.ApiOperation({ summary: 'Delete all user sessions' })
  @Scope(SessionsActions.delete)
  async deleteByUserId(
    @common.Param('user_id') user_id: string,
    @common.Req() req: Request,
    @common.Res() res: Response,
  ) {
    const cookie = new Cookies(req, res);
    await this.redis.revokeAllTokensByUserId(user_id, cookie);
    return res.status(common.HttpStatus.NO_CONTENT).send();
  }

  @common.Delete('clients/:client_id/users/:user_id/sessions')
  @common.HttpCode(common.HttpStatus.NO_CONTENT)
  @swagger.ApiOperation({ summary: 'Delete all user sessions in the application' })
  @Scope(SessionsActions.delete)
  async deleteByClientId(
    @common.Param('user_id') user_id: string,
    @common.Param('client_id') client_id: string,
    @common.Req() req: Request,
    @common.Res() res: Response,
  ) {
    const cookie = new Cookies(req, res);
    await this.redis.revokeAllTokensByUserAndClientId(user_id, client_id, cookie);
    return res.status(common.HttpStatus.NO_CONTENT).send();
  }
}
