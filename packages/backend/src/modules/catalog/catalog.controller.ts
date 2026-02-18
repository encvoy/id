import * as common from '@nestjs/common';
import * as swagger from '@nestjs/swagger';
import { Response } from 'express';
import { ListInputDto } from 'src/custom.dto';
import { Scope, UserId } from '../../decorators';
import { prepareListResponse } from '../../helpers';
import { CatalogActions } from './catalog.roles';
import { CatalogService } from './catalog.service';

@common.Controller('v1')
@swagger.ApiBasicAuth()
@swagger.ApiBearerAuth()
export class CatalogController {
  constructor(private readonly service: CatalogService) {}

  @common.Get('catalog')
  @swagger.ApiOperation({ summary: 'Get list of public clients' })
  @Scope(CatalogActions.list)
  async getCatalog(
    @common.Query() params: ListInputDto,
    @UserId() userId: string,
    @common.Res() res: Response,
  ) {
    const { clients, totalCount } = await this.service.catalog(params, userId);
    return prepareListResponse(res, clients, totalCount, params);
  }

  @common.Get('settings/catalog')
  @swagger.ApiOperation({ summary: 'Get settings of catalog service' })
  @Scope(CatalogActions.settingsRead)
  async getCardsEnabled() {
    return this.service.getCatalogEnabled();
  }

  @common.Put('settings/catalog')
  @swagger.ApiOperation({ summary: 'Update settings of catalog service' })
  @Scope(CatalogActions.settingsWrite)
  async updateSettings(@common.Query('enabled') enabled: boolean) {
    return this.service.updateCatalogEnabled(enabled);
  }
}
