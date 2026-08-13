import * as common from '@nestjs/common';
import * as swagger from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Response } from 'express';
import { I18nService } from 'nestjs-i18n';
import * as dec from 'src/decorators';
import { Ei18nCodes } from 'src/enums';
import { showErrorWidget, showSuccessWidget } from 'src/modules/interaction/interaction.helpers';
import { REDIS_PREFIXES, RedisAdapter } from 'src/modules/redis';
import { ProviderActions } from '../../providers.roles';
import {
  EmailDTO,
  InteractionEmailDto,
  SendTestEmailDTO,
  UpdateEmailTemplateDto,
  GetEmailTemplatesDto,
  PreviewEmailTemplateDto,
} from './email.dto';
import { EmailService } from './email.service';
import { NotificationAction } from './email.types';

@common.Controller('')
export class EmailController {
  constructor(
    private readonly service: EmailService,
    private readonly i18nService: I18nService<Record<string, string>>,
  ) {}

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
        return await showErrorWidget(res, Ei18nCodes.T3E0096, undefined, undefined, undefined, undefined, this.i18nService);
      }
      await this.service.confirmStatus(email, code);
      return await showSuccessWidget(res, undefined, undefined, undefined, this.i18nService);
    } catch (error) {
      return await showErrorWidget(
        res,
        error['message'] || Ei18nCodes.T3E0078,
        undefined,
        undefined,
        undefined,
        undefined,
        this.i18nService,
      );
    }
  }

  @common.Post('/v1/clients/:client_id/test-email')
  @common.HttpCode(common.HttpStatus.NO_CONTENT)
  @swagger.ApiOperation({ summary: 'Sending test email with provider params' })
  @dec.Scope(ProviderActions.write)
  async sendTestEmail(
    @common.Param('client_id') clientId: string,
    @common.Body() params: SendTestEmailDTO,
  ) {
    await this.service.sendTestEmail(params.params);
  }

  @common.Get('/v1/clients/:client_id/providers/:provider_id/email_templates')
  @swagger.ApiOperation({ summary: 'Get email templates list for provider' })
  @dec.Scope(ProviderActions.write)
  async getProviderEmailTemplates(
    @common.Param('client_id') clientId: string,
    @common.Param('provider_id') providerId: string,
    @common.Query() query: GetEmailTemplatesDto,
  ) {
    return this.service.getProviderEmailTemplates(clientId, providerId, query.locale);
  }

  @common.Get('/v1/clients/:client_id/providers/:provider_id/email_templates/:action/presets')
  @swagger.ApiOperation({ summary: 'Get email template presets for provider' })
  @dec.Scope(ProviderActions.write)
  async getProviderEmailTemplatePresets(
    @common.Param('client_id') clientId: string,
    @common.Param('provider_id') providerId: string,
    @common.Param('action', new common.ParseEnumPipe(NotificationAction))
    action: NotificationAction,
    @common.Query() query: GetEmailTemplatesDto,
  ) {
    return this.service.getProviderEmailTemplatePresets(clientId, providerId, action, query.locale);
  }

  @common.Post('/v1/clients/:client_id/providers/:provider_id/email_templates/:action/preview')
  @swagger.ApiOperation({ summary: 'Render email template preview for provider' })
  @dec.Scope(ProviderActions.write)
  async previewProviderEmailTemplate(
    @common.Param('client_id') clientId: string,
    @common.Param('provider_id') providerId: string,
    @common.Param('action', new common.ParseEnumPipe(NotificationAction))
    action: NotificationAction,
    @common.Body() params: PreviewEmailTemplateDto,
    @common.Query() query: GetEmailTemplatesDto,
  ) {
    return this.service.previewProviderEmailTemplate(
      clientId,
      providerId,
      action,
      params.content,
      query.locale,
    );
  }

  @common.Put('/v1/clients/:client_id/providers/:provider_id/email_templates/:action')
  @swagger.ApiOperation({ summary: 'Update provider email template settings' })
  @dec.Scope(ProviderActions.write)
  async updateProviderEmailTemplate(
    @common.Param('client_id') clientId: string,
    @common.Param('provider_id') providerId: string,
    @common.Param('action', new common.ParseEnumPipe(NotificationAction))
    action: NotificationAction,
    @common.Body() params: UpdateEmailTemplateDto,
    @common.Query() query: GetEmailTemplatesDto,
  ) {
    return this.service.updateProviderEmailTemplate(
      clientId,
      providerId,
      action,
      params,
      query.locale,
    );
  }
}
