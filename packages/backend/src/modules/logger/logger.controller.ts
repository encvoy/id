import { Response } from 'express';
import * as common from '@nestjs/common';
import * as swagger from '@nestjs/swagger';
import { prepareListResponse } from '../../helpers';
import { CustomLogger } from './logger.service';
import { UserRoles } from '../../enums';
import { Role, Scope, UserId } from 'src/decorators';
import { LoggerActions } from './logger.roles';
import { ListInputDto } from 'src/custom.dto';

@common.Controller()
@swagger.ApiBasicAuth()
@swagger.ApiBearerAuth()
export class LoggerController {
  constructor(private readonly service: CustomLogger) {}

  @common.Get('v1/logs')
  @swagger.ApiOperation({ summary: 'Getting a log from the database' })
  @Scope(LoggerActions.list)
  async list(
    @common.Query() params: ListInputDto,
    @UserId() user_id: string,
    @Role() role: UserRoles,
    @common.Res() res: Response,
  ) {
    const { logs, totalCount } = await this.service.list(params, user_id, role);
    return prepareListResponse(res, logs, totalCount, params);
  }
}
