import * as common from '@nestjs/common';
import * as sw from '@nestjs/swagger';
import path from 'path';
import { FilesInterceptor } from 'src/middlewares';
import * as dec from '../../decorators';
import { UserRoles } from '../../enums';
import * as dto from './providers.dto';
import { ProviderActions } from './providers.roles';
import { ProviderService } from './providers.service';

@common.Controller('v1/clients/:client_id/providers')
@sw.ApiBasicAuth()
@sw.ApiBearerAuth()
export class ProvidersController {
  constructor(private readonly providerService: ProviderService) {}

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
  ) {
    return this.providerService.updateList(params, clientId);
  }

  @common.Get('')
  @sw.ApiOperation({ summary: 'Getting all providers for an application' })
  async getByClientId(
    @common.Param('client_id') client_id: string,
    @common.Query() params: dto.AllProvidersDto,
    @dec.Role() role: UserRoles,
  ) {
    return this.providerService.getAll(params, client_id, role);
  }

  @common.Delete('/:provider_id')
  @common.HttpCode(204)
  @sw.ApiOperation({ summary: 'Removing a provider' })
  @dec.Scope(ProviderActions.delete)
  async delete(
    @common.Param('client_id') client_id: string,
    @common.Param('provider_id') provider_id: string,
  ) {
    await this.providerService.delete(provider_id, client_id);
  }

  @common.Put('/activate')
  @common.HttpCode(common.HttpStatus.NO_CONTENT)
  @sw.ApiOperation({ summary: 'Associating providers with an application' })
  @dec.Scope(ProviderActions.write)
  async activate(
    @common.Body() params: dto.BindProviderDto,
    @common.Param('client_id') clientId: string,
  ) {
    await this.providerService.activate(params, clientId);
  }

  @common.Put('/deactivate')
  @common.HttpCode(common.HttpStatus.NO_CONTENT)
  @sw.ApiOperation({ summary: 'Unassociating providers with an application' })
  @dec.Scope(ProviderActions.write)
  async deactivate(
    @common.Body() params: dto.BindProviderDto,
    @common.Param('client_id') clientId: string,
  ) {
    await this.providerService.deactivate(params, clientId);
  }

  @common.Post('')
  @sw.ApiOperation({ summary: 'Creating a provider for an application' })
  @dec.Scope(ProviderActions.write)
  async create(
    @common.Body() createProviderDto: any,
    @common.Param('client_id') client_id: string,
    @dec.UserId() user_id: string,
  ) {
    const provider = await this.providerService.create(client_id, user_id, createProviderDto);
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
  ) {
    await this.providerService.update(parseInt(provider_id), client_id, user_id, updateProviderDto);
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
    @common.UploadedFiles()
    files: { avatar?: Express.Multer.File[] },
  ) {
    if (files && files.avatar) {
      updateProviderDto.avatar = files.avatar[0].path.replaceAll(path.sep, path.posix.sep);
    }

    await this.providerService.updateAvatar(
      parseInt(provider_id),
      client_id,
      updateProviderDto.avatar,
    );
  }
}
