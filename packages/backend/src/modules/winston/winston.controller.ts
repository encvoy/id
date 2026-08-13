import * as common from '@nestjs/common';
import * as swagger from '@nestjs/swagger';
import { Scope } from 'src/decorators';
import { CustomLogger } from '../logger';
import { WinstonUpdateDto } from './winston.dto';
import { WinstonActions } from './winston.roles';
import { WinstonService } from './winston.service';

@common.Controller('/v1/winston')
@swagger.ApiBearerAuth()
export class WinstonController {
  constructor(
    private readonly service: WinstonService,
    private readonly logger: CustomLogger,
  ) {}

  @common.Get('')
  @swagger.ApiOperation({ summary: 'Getting Winston Logging Settings' })
  @Scope(WinstonActions.write)
  async getSettings() {
    return this.service.get();
  }

  @common.Put('')
  @swagger.ApiOperation({ summary: 'Changing Winston Logging Settings' })
  @swagger.ApiNoContentResponse()
  @Scope(WinstonActions.write)
  async changeSettings(@common.Body() editSettingsDto: WinstonUpdateDto) {
    await this.service.update(editSettingsDto);
    await this.logger.reconfigureWinston();
  }
}
