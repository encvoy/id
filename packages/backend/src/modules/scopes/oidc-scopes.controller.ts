import * as common from '@nestjs/common';
import * as swagger from '@nestjs/swagger';
import { Request } from 'express';
import { Scope } from '../../decorators';
import { UserId } from '../../decorators';
import { Actions } from '../../enums';
import { CustomLogger } from '../logger';
import { BindOidcScopeFieldDto, CreateOidcScopeDto, UpdateOidcScopeDto } from './scopes.dto';
import { ScopesActions } from './scopes.roles';
import { ScopeService } from './scopes.service';

const getDefinedKeys = <T extends object>(payload: T, excludedKeys: string[] = []) =>
  Object.entries(payload as Record<string, unknown>)
    .filter(([key, value]) => value !== undefined && !excludedKeys.includes(key))
    .map(([key]) => key);

@common.Controller('v1/clients/:client_id/oidc/scopes')
@swagger.ApiBearerAuth()
export class OidcScopesController {
  constructor(
    private readonly service: ScopeService,
    private readonly logger: CustomLogger,
  ) {}

  @common.Get()
  @swagger.ApiOperation({ summary: 'Get dynamic OIDC scopes for an organization' })
  @Scope(ScopesActions.manageOidc)
  async list(@common.Param('client_id') clientId: string) {
    return this.service.listOidcScopeGroups(clientId);
  }

  @common.Post()
  @swagger.ApiOperation({ summary: 'Create a dynamic OIDC scope' })
  @Scope(ScopesActions.manageOidc)
  async create(
    @common.Param('client_id') clientId: string,
    @common.Body() params: CreateOidcScopeDto,
    @UserId() userId: string,
    @common.Req() req: Request,
  ) {
    const scope = await this.service.createOidcScopeGroup(clientId, params);

    await this.logger.logEvent({
      ip_address: req.ip,
      device: req.headers['user-agent'],
      user_id: userId,
      client_id: clientId,
      event: Actions.OIDC_SCOPE_CREATE,
      description: '',
      details: {
        target: scope.id,
        changed_fields: getDefinedKeys(params),
      },
    });

    return scope;
  }

  @common.Put(':scope_id')
  @swagger.ApiOperation({ summary: 'Update a dynamic OIDC scope' })
  @Scope(ScopesActions.manageOidc)
  async update(
    @common.Param('client_id') clientId: string,
    @common.Param('scope_id') scopeId: string,
    @common.Body() params: UpdateOidcScopeDto,
    @UserId() userId: string,
    @common.Req() req: Request,
  ) {
    const scope = await this.service.updateOidcScopeGroup(clientId, scopeId, params);

    await this.logger.logEvent({
      ip_address: req.ip,
      device: req.headers['user-agent'],
      user_id: userId,
      client_id: clientId,
      event: Actions.OIDC_SCOPE_UPDATE,
      description: '',
      details: {
        target: scopeId,
        changed_fields: getDefinedKeys(params),
      },
    });

    return scope;
  }

  @common.Post(':scope_id/fields')
  @swagger.ApiOperation({ summary: 'Bind a custom profile field to a dynamic OIDC scope' })
  @Scope(ScopesActions.manageOidc)
  async bindField(
    @common.Param('client_id') clientId: string,
    @common.Param('scope_id') scopeId: string,
    @common.Body() params: BindOidcScopeFieldDto,
    @UserId() userId: string,
    @common.Req() req: Request,
  ) {
    const scope = await this.service.bindOidcScopeField(clientId, scopeId, params);

    await this.logger.logEvent({
      ip_address: req.ip,
      device: req.headers['user-agent'],
      user_id: userId,
      client_id: clientId,
      event: Actions.OIDC_SCOPE_FIELD_BIND,
      description: '',
      details: {
        target: scopeId,
        changed_fields: getDefinedKeys(params),
      },
    });

    return scope;
  }

  @common.Delete(':scope_id')
  @common.HttpCode(common.HttpStatus.NO_CONTENT)
  @swagger.ApiOperation({ summary: 'Delete a dynamic OIDC scope' })
  @Scope(ScopesActions.manageOidc)
  async delete(
    @common.Param('client_id') clientId: string,
    @common.Param('scope_id') scopeId: string,
    @UserId() userId: string,
    @common.Req() req: Request,
  ) {
    await this.service.deleteOidcScopeGroup(clientId, scopeId);

    await this.logger.logEvent({
      ip_address: req.ip,
      device: req.headers['user-agent'],
      user_id: userId,
      client_id: clientId,
      event: Actions.OIDC_SCOPE_DELETE,
      description: '',
      details: {
        target: scopeId,
      },
    });
  }

  @common.Delete(':scope_id/fields/:profile_field_id')
  @common.HttpCode(common.HttpStatus.NO_CONTENT)
  @swagger.ApiOperation({ summary: 'Remove a custom profile field from a dynamic OIDC scope' })
  @Scope(ScopesActions.manageOidc)
  async deleteField(
    @common.Param('client_id') clientId: string,
    @common.Param('scope_id') scopeId: string,
    @common.Param('profile_field_id') profileFieldId: string,
    @UserId() userId: string,
    @common.Req() req: Request,
  ) {
    await this.service.deleteOidcScopeField(clientId, scopeId, profileFieldId);

    await this.logger.logEvent({
      ip_address: req.ip,
      device: req.headers['user-agent'],
      user_id: userId,
      client_id: clientId,
      event: Actions.OIDC_SCOPE_FIELD_UNBIND,
      description: '',
      details: {
        target: scopeId,
        profile_field_id: profileFieldId,
      },
    });
  }
}
