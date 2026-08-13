import * as common from '@nestjs/common';
import * as swagger from '@nestjs/swagger';
import { Request } from 'express';
import { CLIENT_ID } from 'src/constants';
import { Role, Scope } from 'src/decorators';
import { UserId } from '../../decorators';
import { Actions, UserRoles } from '../../enums';
import { CustomLogger } from '../logger';
import * as dto from './settings.dto';
import { SettingsActions } from './settings.roles';
import { SettingsService } from './settings.service';

const getDefinedKeys = <T extends object>(payload: T, excludedKeys: string[] = []) =>
  Object.entries(payload as Record<string, unknown>)
    .filter(([key, value]) => value !== undefined && !excludedKeys.includes(key))
    .map(([key]) => key);

@common.Controller('v1/settings')
export class SettingsController {
  constructor(
    private readonly service: SettingsService,
    private readonly logger: CustomLogger,
  ) {}

  private resolveSettingsScopeId(
    scope?: Partial<Pick<dto.GetProfileFieldsDto, 'client_id' | 'organization_id'>>,
  ) {
    return scope?.organization_id ?? scope?.client_id ?? CLIENT_ID;
  }

  //#region settings
  @common.Get('')
  @swagger.ApiOperation({ summary: 'Get system settings' })
  async getSettings(@Role() role: UserRoles) {
    return this.service.getSettings(role);
  }

  @common.Put('')
  @swagger.ApiOperation({ summary: 'Update system settings' })
  @Scope(SettingsActions.update)
  async changeSettings(
    @common.Body() editSettingsDto: dto.EditSettingsDto,
    @UserId() userId: string,
    @common.Req() req: Request,
  ) {
    await this.service.changeSettings(editSettingsDto);

    await this.logger.logEvent({
      ip_address: req.ip,
      device: req.headers['user-agent'],
      user_id: userId,
      client_id: CLIENT_ID,
      event: Actions.SETTINGS_UPDATE,
      description: '',
      details: {
        target: CLIENT_ID,
        changed_fields: getDefinedKeys(editSettingsDto),
      },
    });
  }
  //#endregion

  //#region profile_fields
  @common.Get('/profile_fields')
  @swagger.ApiOperation({ summary: 'Get profile fields list' })
  async getProfileFields(@common.Query() query: dto.GetProfileFieldsDto) {
    return this.service.getProfileFields(undefined, {
      clientId: query.client_id,
      organizationId: query.organization_id,
    });
  }

  @common.Post('/profile_fields')
  @swagger.ApiOperation({ summary: 'Add custom user field' })
  @Scope(SettingsActions.update)
  async addProfileField(
    @common.Body() params: dto.CreateProfileFieldDto,
    @common.Query() query: dto.GetProfileFieldsDto,
    @UserId() userId: string,
    @common.Req() req: Request,
  ) {
    const payload = {
      ...params,
      client_id: params.client_id ?? query.client_id,
      organization_id: params.organization_id ?? query.organization_id,
    };

    const result = await this.service.addProfileField(payload);

    await this.logger.logEvent({
      ip_address: req.ip,
      device: req.headers['user-agent'],
      user_id: userId,
      client_id: this.resolveSettingsScopeId(payload),
      event: Actions.PROFILE_FIELD_CREATE,
      description: '',
      details: {
        target: payload.field,
        changed_fields: getDefinedKeys(payload),
      },
    });

    return result;
  }

  @common.Put('/profile_fields/:field_name')
  @swagger.ApiOperation({ summary: 'Update custom field settings' })
  @Scope(SettingsActions.update)
  async updateProfileField(
    @common.Param('field_name') field_name: string,
    @common.Body() params: dto.UpdateProfileFieldDto,
    @common.Query() query: dto.GetProfileFieldsDto,
    @UserId() userId: string,
    @common.Req() req: Request,
  ) {
    const payload = {
      ...params,
      client_id: params.client_id ?? query.client_id,
      organization_id: params.organization_id ?? query.organization_id,
    };

    const result = await this.service.updateProfileField(field_name, payload);

    await this.logger.logEvent({
      ip_address: req.ip,
      device: req.headers['user-agent'],
      user_id: userId,
      client_id: this.resolveSettingsScopeId(payload),
      event: Actions.PROFILE_FIELD_UPDATE,
      description: '',
      details: {
        target: field_name,
        changed_fields: getDefinedKeys(payload),
      },
    });

    return result;
  }

  @common.Delete('/profile_fields/:field_name')
  @swagger.ApiOperation({ summary: 'Delete custom user field' })
  @Scope(SettingsActions.update)
  async deleteCustomField(
    @common.Param('field_name') field_name: string,
    @common.Query() query: dto.GetProfileFieldsDto,
    @UserId() userId: string,
    @common.Req() req: Request,
  ) {
    await this.service.deleteProfileField(field_name, {
      clientId: query.client_id,
      organizationId: query.organization_id,
    });

    await this.logger.logEvent({
      ip_address: req.ip,
      device: req.headers['user-agent'],
      user_id: userId,
      client_id: this.resolveSettingsScopeId(query),
      event: Actions.PROFILE_FIELD_DELETE,
      description: '',
      details: {
        target: field_name,
      },
    });
  }
  //#endregion

  @common.Get('/rules')
  @swagger.ApiOperation({ summary: 'Get field rules list' })
  async getRules(@common.Query() query: dto.GetProfileFieldsDto) {
    return this.service.getAllRules(false, {
      clientId: query.client_id,
      organizationId: query.organization_id,
    });
  }

  //#region Client types
  @common.Get('/client_types')
  @swagger.ApiOperation({ summary: 'Get client types list' })
  async getClientTypes() {
    return this.service.getClientTypes();
  }

  @common.Post('/client_types')
  @swagger.ApiOperation({ summary: 'Add client type' })
  @Scope(SettingsActions.update)
  async addClientType(
    @common.Body() params: dto.CreateClientTypeDto,
    @UserId() userId: string,
    @common.Req() req: Request,
  ) {
    const clientType = await this.service.addClientType(params);

    await this.logger.logEvent({
      ip_address: req.ip,
      device: req.headers['user-agent'],
      user_id: userId,
      client_id: CLIENT_ID,
      event: Actions.CLIENT_TYPE_CREATE,
      description: '',
      details: {
        target: clientType.id,
        changed_fields: getDefinedKeys(params),
      },
    });

    return clientType;
  }

  @common.Put('/client_types/:client_type_id')
  @swagger.ApiOperation({ summary: 'Update client type' })
  @Scope(SettingsActions.update)
  async updateClientType(
    @common.Param('client_type_id') id: string,
    @common.Body() params: dto.CreateClientTypeDto,
    @UserId() userId: string,
    @common.Req() req: Request,
  ) {
    const clientType = await this.service.updateClientType(id, params);

    await this.logger.logEvent({
      ip_address: req.ip,
      device: req.headers['user-agent'],
      user_id: userId,
      client_id: CLIENT_ID,
      event: Actions.CLIENT_TYPE_UPDATE,
      description: '',
      details: {
        target: id,
        changed_fields: getDefinedKeys(params),
      },
    });

    return clientType;
  }

  @common.Delete('/client_types/:client_type_id')
  @common.HttpCode(204)
  @swagger.ApiOperation({ summary: 'Delete client type' })
  @Scope(SettingsActions.update)
  async deleteClientType(
    @common.Param('client_type_id') id: string,
    @UserId() userId: string,
    @common.Req() req: Request,
  ) {
    await this.service.deleteClientType(id);

    await this.logger.logEvent({
      ip_address: req.ip,
      device: req.headers['user-agent'],
      user_id: userId,
      client_id: CLIENT_ID,
      event: Actions.CLIENT_TYPE_DELETE,
      description: '',
      details: {
        target: id,
      },
    });
  }
  //#endregion
}
