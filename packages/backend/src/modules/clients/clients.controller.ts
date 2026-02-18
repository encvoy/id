import * as common from '@nestjs/common';
import * as swagger from '@nestjs/swagger';
import { Response } from 'express';
import { ListInputDto } from 'src/custom.dto';
import { Role, Scope, UserId } from '../../decorators';
import { Ei18nCodes, UserRoles } from '../../enums';
import { prepareListResponse } from '../../helpers';
import { FilesInterceptor } from '../../middlewares';
import * as dto from './clients.dto';
import { ClientActions } from './clients.roles';
import { ClientService } from './clients.service';

@common.Controller('v1/clients')
@swagger.ApiBasicAuth()
@swagger.ApiBearerAuth()
export class ClientsController {
  constructor(private readonly service: ClientService) {}

  @common.Get('/white-list')
  async getWhiteList() {
    return this.service.getWhiteList();
  }

  @common.Post()
  @swagger.ApiOperation({ summary: 'Create a new client application' })
  @Scope(ClientActions.write)
  async create(@common.Body() createClientDto: dto.CreateClientDto, @UserId() user_id: string) {
    return this.service.create(user_id, createClientDto);
  }

  @common.Get()
  @swagger.ApiOperation({ summary: 'Get a list of client applications' })
  @Scope(ClientActions.list)
  async getAll(
    @common.Query() params: ListInputDto,
    @UserId() user_id: string,
    @Role() role: UserRoles,
    @common.Res() res: Response,
  ) {
    const { clients, totalCount } = await this.service.list(params, user_id, role);
    return prepareListResponse(res, clients, totalCount, params);
  }

  @common.Get(':client_id')
  @swagger.ApiOperation({ summary: 'Get a client application by client_id' })
  async getById(@common.Param('client_id') client_id: string, @Role() role: UserRoles) {
    if (role !== UserRoles.EDITOR && role !== UserRoles.OWNER)
      return this.service.getByIdShort(client_id);

    return this.service.getById(client_id);
  }

  @common.Put(':client_id')
  @swagger.ApiOperation({ summary: 'Edit a client application' })
  @Scope(ClientActions.write)
  async update(
    @common.Body() updateClientDto: dto.UpdateClientDto,
    @common.Param('client_id') clientId: string,
  ) {
    return this.service.update(updateClientDto, clientId);
  }

  @common.Put(':client_id/images')
  @swagger.ApiOperation({ summary: 'Update client application images' })
  @swagger.ApiConsumes('multipart/form-data')
  @common.UseInterceptors(
    FilesInterceptor(
      'public/images/client',
      ...[{ fieldName: 'avatar' }, { fieldName: 'cover', size: 1024 * 1024 * 10 }],
    ),
  )
  @Scope(ClientActions.write)
  async updateAvatar(
    @common.Body() updateClientDto: dto.UpdateAvatarClientDto,
    @common.Param('client_id') clientId: string,
    @common.UploadedFiles()
    files: { avatar?: Express.Multer.File[]; cover?: Express.Multer.File[] },
  ) {
    if (files && files.avatar) {
      updateClientDto.avatar = files.avatar[0].path;
    }
    if (files && files.cover) {
      updateClientDto.cover = files.cover[0].path;
    }
    return this.service.updateAvatar(updateClientDto, clientId);
  }

  @common.Delete(':client_id')
  @swagger.ApiOperation({ summary: 'Delete a client application' })
  @Scope(ClientActions.delete)
  async delete(@common.Param('client_id') clientId: string) {
    await this.service.delete(clientId);
  }

  @common.Get(':client_id/users')
  @swagger.ApiOperation({ summary: 'Get a list of application users' })
  @Scope(ClientActions.list)
  async listUsers(
    @common.Query() params: ListInputDto,
    @common.Param('client_id') client_id: string,
    @common.Res() res: Response,
  ) {
    const { items, totalCount } = await this.service.listUsers(params, client_id);
    return prepareListResponse(res, items, totalCount, params);
  }

  @common.Get(':client_id/users/:user_id')
  @swagger.ApiOperation({ summary: 'Get client application user data' })
  @Scope(ClientActions.list)
  async getUser(
    @common.Param('client_id') client_id: string,
    @common.Param('user_id') targetUserId: string,
    @UserId() userId,
  ) {
    return this.service.getUserById(userId, targetUserId, client_id);
  }

  @common.Get(':client_id/users/:user_id/role')
  @swagger.ApiOperation({ summary: 'Get a user role in an application' })
  @Scope(ClientActions.getRole)
  async getRoleInApp(
    @common.Param('user_id') user_id: string,
    @common.Param('client_id') client_id: string,
  ) {
    const role = await this.service.findRoleInApp(user_id, client_id);

    if (!role) {
      throw new common.BadRequestException(Ei18nCodes.T3E0003);
    }

    return { role };
  }

  @common.HttpCode(common.HttpStatus.NO_CONTENT)
  @common.Put(':client_id/users/:user_id/role')
  @swagger.ApiOperation({ summary: 'Change a user role in an application' })
  @Scope(ClientActions.updateRole)
  async updateRole(
    @common.Param('user_id') user_id: string,
    @common.Param('client_id') client_id: string,
    @common.Body() body: dto.UpdateRoleDTO,
  ) {
    await this.service.updateRole(user_id, client_id, body);
  }

  @common.HttpCode(common.HttpStatus.NO_CONTENT)
  @common.Delete(':client_id/users/:user_id/role')
  @swagger.ApiOperation({ summary: 'Delete a user role in an application' })
  @Scope(ClientActions.updateRole)
  async deleteRole(
    @common.Param('user_id') user_id: string,
    @common.Param('client_id') client_id: string,
  ) {
    await this.service.deleteRole(user_id, client_id);
  }

  @common.Post(':client_id/rules/:rule_id')
  @swagger.ApiOperation({ summary: 'Add a rule to an application' })
  @Scope(ClientActions.write)
  async addRuleValidationToRule(
    @common.Param('client_id') client_id: string,
    @common.Param('rule_id') rule_id: string,
  ) {
    await this.service.addRule(client_id, rule_id);
  }

  @common.Delete(':client_id/rules/:rule_id')
  @common.HttpCode(204)
  @swagger.ApiOperation({ summary: 'Remove a rule from an application' })
  @Scope(ClientActions.write)
  async deleteRuleValidationFromRule(
    @common.Param('client_id') client_id: string,
    @common.Param('rule_id') rule_id: string,
  ) {
    await this.service.deleteRule(client_id, rule_id);
  }
}
