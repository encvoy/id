import { Request, Response } from 'express';
import * as common from '@nestjs/common';
import * as swagger from '@nestjs/swagger';
import { CLIENT_ID } from 'src/constants';
import { Scope, UserId } from '../../decorators';
import { ListInputDto } from 'src/custom.dto';
import { Actions } from '../../enums';
import { ScopesActions } from './scopes.roles';
import { prepareListResponse } from 'src/helpers';
import { ScopeService } from './scopes.service';
import { RedisAdapter } from '../redis/redis.adapter';
import Cookies from 'cookies';
import { CustomLogger } from '../logger';

@common.Controller('v1/users/:user_id/scopes')
@swagger.ApiBearerAuth()
export class ScopesController {
  constructor(
    private readonly service: ScopeService,
    private readonly redis: RedisAdapter,
    private readonly logger: CustomLogger,
  ) {}

  @common.Get()
  @swagger.ApiOperation({ summary: 'Getting a list of application permissions' })
  @Scope(ScopesActions.list)
  async list(
    @common.Query() params: ListInputDto,
    @common.Param('user_id') user_id: string,
    @common.Res() res: Response,
  ) {
    const { scopes, totalCount } = await this.service.list(params, user_id);
    return prepareListResponse(res, scopes, totalCount, params);
  }

  @common.Delete()
  @common.HttpCode(common.HttpStatus.NO_CONTENT)
  @swagger.ApiOperation({ summary: 'Revoking application permissions' })
  @swagger.ApiQuery({ name: 'client_id', isArray: true })
  @Scope(ScopesActions.delete)
  async delete(
    @common.Query('client_id') ids: string[] | string,
    @common.Param('user_id') user_id: string,
    @common.Req() req: Request,
    @UserId() actorUserId: string,
    @common.Res() res: Response,
  ) {
    const clientIdsArray = Array.isArray(ids) ? ids : [ids];
    await this.service.delete(clientIdsArray, user_id);

    const cookie = new Cookies(req, res);
    await Promise.all(
      clientIdsArray.map(async (client_id) => {
        await this.redis.revokeAllTokensByUserAndClientId(user_id, client_id, cookie);
      }),
    );

    await this.logger.logEvent({
      ip_address: req.ip,
      device: req.headers['user-agent'],
      user_id: actorUserId,
      client_id: CLIENT_ID,
      event: Actions.USER_SCOPES_REVOKE,
      description: '',
      details: {
        target: user_id,
        client_ids: clientIdsArray,
      },
    });

    return res.status(common.HttpStatus.NO_CONTENT).send();
  }
}
