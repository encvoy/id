import * as common from '@nestjs/common';
import * as sw from '@nestjs/swagger';
import { Request } from 'express';
import path from 'path';
import { FilesInterceptor } from 'src/middlewares/interceptors/files.interceptor';
import * as dec from '../../decorators';
import { Actions, UserRoles } from '../../enums';
import { CustomLogger } from '../logger';
import * as dto from './providers.dto';
import { ProviderActions } from './providers.roles';
import { ProviderService } from './providers.service';

const getDefinedKeys = <T extends object>(payload: T, excludedKeys: string[] = []) =>
  Object.entries(payload as Record<string, unknown>)
    .filter(([key, value]) => value !== undefined && !excludedKeys.includes(key))
    .map(([key]) => key);

@common.Controller('v1/clients/:client_id/providers')
@sw.ApiBearerAuth()
export class ProvidersController {
  constructor(
    private readonly providerService: ProviderService,
    private readonly logger: CustomLogger,
  ) {}

  @common.Get('list')
  @sw.ApiOperation({ summary: 'Getting list providers for an application' })
  async getList(
    @common.Param('client_id') client_id: string,
    @common.Query() params: dto.ListProvidersDto,
    @dec.Role() role: UserRoles,
  ) {
    return this.providerService.getList(params, client_id, role);
  }

  @common.Put('list')
  @sw.ApiOperation({ summary: 'Getting all providers for an application' })
  @dec.Scope(ProviderActions.write)
  async updateList(
    @common.Body() params: dto.UpdateListProvidersDto,
    @common.Param('client_id') clientId: string,
    @dec.UserId() userId: string,
    @common.Req() req: Request,
  ) {
    const result = await this.providerService.updateList(params, clientId);

    await this.logger.logEvent({
      ip_address: req.ip,
      device: req.headers['user-agent'],
      user_id: userId,
      client_id: clientId,
      event: Actions.PROVIDER_LAYOUT_UPDATE,
      description: '',
      details: {
        target: clientId,
        changed_fields: getDefinedKeys(params),
      },
    });

    return result;
  }

  @common.Get('')
  @sw.ApiOperation({ summary: 'Getting all providers for an application' })
  async getByClientId(
    @common.Param('client_id') client_id: string,
    @common.Query() params: dto.AllProvidersDto,
    @dec.Role() role: UserRoles,
    @dec.UserId() user_id: string,
  ) {
    return this.providerService.getAll(params, client_id, role, user_id);
  }

  @common.Delete('/:provider_id')
  @common.HttpCode(204)
  @sw.ApiOperation({ summary: 'Removing a provider' })
  @dec.Scope(ProviderActions.delete)
  async delete(
    @common.Param('client_id') client_id: string,
    @common.Param('provider_id') provider_id: string,
    @dec.UserId() userId: string,
    @common.Req() req: Request,
  ) {
    await this.providerService.delete(provider_id, client_id);

    await this.logger.logEvent({
      ip_address: req.ip,
      device: req.headers['user-agent'],
      user_id: userId,
      client_id: client_id,
      event: Actions.PROVIDER_DELETE,
      description: '',
      details: {
        target: provider_id,
      },
    });
  }

  @common.Put('/activate')
  @common.HttpCode(common.HttpStatus.NO_CONTENT)
  @sw.ApiOperation({ summary: 'Associating providers with an application' })
  @dec.Scope(ProviderActions.write)
  async activate(
    @common.Body() params: dto.BindProviderDto,
    @common.Param('client_id') clientId: string,
    @dec.UserId() userId: string,
    @common.Req() req: Request,
  ) {
    await this.providerService.activate(params, clientId);

    await this.logger.logEvent({
      ip_address: req.ip,
      device: req.headers['user-agent'],
      user_id: userId,
      client_id: clientId,
      event: Actions.PROVIDER_BIND,
      description: '',
      details: {
        target: params.provider_id,
        changed_fields: getDefinedKeys(params),
      },
    });
  }

  @common.Put('/deactivate')
  @common.HttpCode(common.HttpStatus.NO_CONTENT)
  @sw.ApiOperation({ summary: 'Unassociating providers with an application' })
  @dec.Scope(ProviderActions.write)
  async deactivate(
    @common.Body() params: dto.BindProviderDto,
    @common.Param('client_id') clientId: string,
    @dec.UserId() userId: string,
    @common.Req() req: Request,
  ) {
    await this.providerService.deactivate(params, clientId);

    await this.logger.logEvent({
      ip_address: req.ip,
      device: req.headers['user-agent'],
      user_id: userId,
      client_id: clientId,
      event: Actions.PROVIDER_UNBIND,
      description: '',
      details: {
        target: params.provider_id,
        changed_fields: getDefinedKeys(params),
      },
    });
  }

  @common.Post('')
  @sw.ApiOperation({ summary: 'Creating a provider for an application' })
  @dec.Scope(ProviderActions.write)
  async create(
    @common.Body() createProviderDto: any,
    @common.Param('client_id') client_id: string,
    @dec.UserId() user_id: string,
    @common.Req() req: Request,
  ) {
    const provider = await this.providerService.create(client_id, user_id, createProviderDto);

    await this.logger.logEvent({
      ip_address: req.ip,
      device: req.headers['user-agent'],
      user_id: user_id,
      client_id: client_id,
      event: Actions.PROVIDER_CREATE,
      description: '',
      details: {
        target: provider.id,
        changed_fields: getDefinedKeys(createProviderDto, ['external_client_secret']),
      },
    });

    return { id: provider.id };
  }

  @common.Put('/:provider_id')
  @common.HttpCode(common.HttpStatus.NO_CONTENT)
  @sw.ApiOperation({ summary: 'Updating a provider for an application' })
  @dec.Scope(ProviderActions.write)
  async update(
    @common.Body() updateProviderDto: any,
    @common.Param('client_id') client_id: string,
    @common.Param('provider_id') provider_id: string,
    @dec.UserId() user_id: string,
    @common.Req() req: Request,
  ) {
    await this.providerService.update(provider_id, client_id, user_id, updateProviderDto);

    await this.logger.logEvent({
      ip_address: req.ip,
      device: req.headers['user-agent'],
      user_id: user_id,
      client_id: client_id,
      event: Actions.PROVIDER_UPDATE,
      description: '',
      details: {
        target: provider_id,
        changed_fields: getDefinedKeys(updateProviderDto, ['external_client_secret']),
      },
    });
  }

  @common.Put('/:provider_id/avatar')
  @common.HttpCode(common.HttpStatus.NO_CONTENT)
  @sw.ApiOperation({ summary: 'Updating a providers avatar' })
  @sw.ApiConsumes('multipart/form-data')
  @dec.Scope(ProviderActions.write)
  @common.UseInterceptors(FilesInterceptor('public/images/provider', { fieldName: 'avatar' }))
  async updateAvatar(
    @common.Body() updateProviderDto: dto.AvatarProviderDto,
    @common.Param('client_id') client_id: string,
    @common.Param('provider_id') provider_id: string,
    @dec.UserId() userId: string,
    @common.Req() req: Request,
    @common.UploadedFiles()
    files: { avatar?: Express.Multer.File[] },
  ) {
    if (files && files.avatar) {
      updateProviderDto.avatar = files.avatar[0].path.replaceAll(path.sep, path.posix.sep);
    }

    await this.providerService.updateAvatar(
      provider_id,
      client_id,
      updateProviderDto.avatar,
    );

    await this.logger.logEvent({
      ip_address: req.ip,
      device: req.headers['user-agent'],
      user_id: userId,
      client_id: client_id,
      event: Actions.PROVIDER_AVATAR_UPDATE,
      description: '',
      details: {
        target: provider_id,
        changed_fields: getDefinedKeys(updateProviderDto),
      },
    });
  }
}
