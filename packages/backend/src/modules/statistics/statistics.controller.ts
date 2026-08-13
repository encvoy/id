import * as common from '@nestjs/common';
import * as swagger from '@nestjs/swagger';
import { Scope } from 'src/decorators';
import { ClientActions } from '../clients/clients.roles';
import { StatisticsService } from './statistics.service';
import * as dto from './statistics.dto';

@common.Controller('v1/statistics')
@swagger.ApiBearerAuth()
export class StatisticsController {
  constructor(private readonly service: StatisticsService) {}

  @common.Get('clients/:client_id/dashboard')
  @swagger.ApiOperation({ summary: 'Get dashboard statistics for an application' })
  @swagger.ApiOkResponse({ type: dto.ClientDashboardStatisticsDto })
  @Scope(ClientActions.read)
  async getClientDashboardStatistics(
    @common.Param('client_id') client_id: string,
    @common.Query() query: dto.ClientDashboardStatisticsQueryDto,
  ) {
    return this.service.getClientDashboardStatistics(client_id, query.days || 30);
  }
}
