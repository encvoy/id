import * as common from '@nestjs/common';
import * as swagger from '@nestjs/swagger';
import { Scope } from 'src/decorators';
import { SentryUpdateDto } from './sentry.dto';
import { SentryActions } from './sentry.roles';
import { SentryService } from './sentry.service';

@common.Controller('/v1/sentry')
@swagger.ApiBasicAuth()
@swagger.ApiBearerAuth()
export class SentryController {
  constructor(private readonly service: SentryService) {}

  @common.Get('')
  @swagger.ApiOperation({ summary: 'Getting Sentry Settings' })
  @Scope(SentryActions.write)
  async getSettings() {
    return this.service.get();
  }

  @common.Put('')
  @swagger.ApiOperation({ summary: 'Changing Sentry Settings' })
  @swagger.ApiNoContentResponse()
  @Scope(SentryActions.write)
  async changeSettings(@common.Body() editSettingsDto: SentryUpdateDto) {
    await this.service.update(editSettingsDto);
  }
}
