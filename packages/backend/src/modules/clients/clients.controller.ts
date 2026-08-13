import * as common from '@nestjs/common';
import * as swagger from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ListInputDto } from 'src/custom.dto';
import { Role, Scope, UserId } from '../../decorators';
import { Actions, Ei18nCodes, UserRoles } from '../../enums';
import { prepareListResponse } from '../../helpers';
import { FilesInterceptor } from '../../middlewares/interceptors/files.interceptor';
import { CustomLogger } from '../logger';
import { CreateUserDTO } from '../users/users.dto';
import * as dto from './clients.dto';
import { ClientActions } from './clients.roles';
import { ClientService } from './clients.service';

const getDefinedKeys = <T extends object>(payload: T, excludedKeys: string[] = []) =>
  Object.entries(payload as Record<string, unknown>)
    .filter(([key, value]) => value !== undefined && !excludedKeys.includes(key))
    .map(([key]) => key);

@common.Controller('v1/clients')
@swagger.ApiBearerAuth()
export class ClientsController {
  constructor(private readonly service: ClientService, private readonly logger: CustomLogger) {}

  private async logClientEvent(
    req: Request,
    userId: string | null | undefined,
    clientId: string,
    event: Actions,
    details: object,
  ) {
    await this.logger.logEvent({
      ip_address: req.ip,
      device: req.headers['user-agent'],
      user_id: userId,
      client_id: clientId,
      event,
      description: '',
      details,
    });
  }

  @common.Get('/white-list')
  async getWhiteList() {
    return this.service.getWhiteList();
  }

  @common.Post()
  @swagger.ApiOperation({ summary: 'Create a new client application' })
  @Scope(ClientActions.write)
  async create(
    @common.Body() createClientDto: dto.CreateClientDto,
    @UserId() user_id: string,
    @common.Req() req: Request,
  ) {
    const client = await this.service.create(user_id, createClientDto);

    await this.logClientEvent(req, user_id, client.client_id, Actions.CLIENT_CREATE, {
      target: client.client_id,
      changed_fields: getDefinedKeys(createClientDto),
    });

    return client;
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
    @UserId() userId: string,
    @common.Req() req: Request,
  ) {
    const updatedClient = await this.service.update(updateClientDto, clientId);

    await this.logClientEvent(req, userId, clientId, Actions.CLIENT_UPDATE, {
      target: clientId,
      action: 'client_updated',
      changed_fields: getDefinedKeys(updateClientDto, ['client_secret']),
    });

    return updatedClient;
  }

  @common.Post(':client_id/regenerate-secret')
  @swagger.ApiOperation({ summary: 'Regenerate a client application secret' })
  @Scope(ClientActions.write)
  async regenerateClientSecret(
    @common.Param('client_id') clientId: string,
    @UserId() userId: string,
    @common.Req() req: Request,
  ) {
    const updatedClient = await this.service.regenerateClientSecret(clientId);

    await this.logClientEvent(req, userId, clientId, Actions.CLIENT_UPDATE, {
      target: clientId,
      action: 'client_secret_regenerated',
      changed_fields: ['client_secret'],
    });

    return updatedClient;
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
    @UserId() userId: string,
    @common.Req() req: Request,
    @common.UploadedFiles()
    files: { avatar?: Express.Multer.File[]; cover?: Express.Multer.File[] },
  ) {
    if (files && files.avatar) {
      updateClientDto.avatar = files.avatar[0].path;
    }
    if (files && files.cover) {
      updateClientDto.cover = files.cover[0].path;
    }

    const updatedClient = await this.service.updateAvatar(updateClientDto, clientId);

    await this.logClientEvent(req, userId, clientId, Actions.CLIENT_UPDATE, {
      target: clientId,
      action: 'client_images_updated',
      changed_fields: getDefinedKeys(updateClientDto),
    });

    return updatedClient;
  }

  @common.Put(':client_id/owner')
  @swagger.ApiOperation({ summary: 'Transfer client application owner' })
  @Scope(ClientActions.updateRole)
  async transferOwner(
    @common.Body() body: dto.TransferClientOwnerDto,
    @common.Param('client_id') clientId: string,
    @UserId() userId: string,
    @common.Req() req: Request,
  ) {
    await this.service.transferOwner(clientId, body.user_id, userId);

    await this.logClientEvent(req, userId, clientId, Actions.CLIENT_UPDATE, {
      target: clientId,
      action: 'client_owner_transferred',
      changed_fields: ['owner'],
    });
  }

  @common.Post('orgs')
  @swagger.ApiOperation({ summary: 'Create a client organization' })
  @Scope(ClientActions.createOrg)
  async createOrganization(@UserId() userId: string, @common.Req() req: Request) {
    const result = await this.service.createOrganization(userId);

    await this.logClientEvent(req, userId, result.orgId, Actions.CLIENT_CREATE, {
      target: result.orgId,
      action: 'client_organization_created',
    });

    return result;
  }

  @common.Delete(':client_id')
  @swagger.ApiOperation({ summary: 'Delete a client application' })
  @Scope(ClientActions.delete)
  async delete(
    @common.Param('client_id') clientId: string,
    @UserId() userId: string,
    @common.Req() req: Request,
  ) {
    await this.service.delete(clientId);

    await this.logClientEvent(req, userId, clientId, Actions.CLIENT_DELETE, {
      target: clientId,
    });
  }

  @common.Get(':client_id/users')
  @swagger.ApiOperation({ summary: 'Get a list of application users' })
  @Scope(ClientActions.users_list)
  async listUsers(
    @common.Query() params: ListInputDto,
    @common.Param('client_id') client_id: string,
    @UserId() actorUserId: string,
    @common.Res() res: Response,
  ) {
    const { items, totalCount } = await this.service.listUsers(params, client_id, actorUserId);
    return prepareListResponse(res, items, totalCount, params);
  }

  @common.Post(':client_id/users')
  @swagger.ApiOperation({ summary: 'Create a user in a client organization' })
  @Scope(ClientActions.write)
  async createUser(
    @common.Param('client_id') client_id: string,
    @common.Body() createUserDto: CreateUserDTO,
    @UserId() actorUserId: string,
    @common.Req() req: Request,
  ) {
    const createdUser = await this.service.createUser(client_id, createUserDto, actorUserId);

    await this.logClientEvent(req, actorUserId, client_id, Actions.USER_CREATE, {
      target: createdUser.id,
      changed_fields: getDefinedKeys(createUserDto, [
        'password',
        'send_account_create_email',
      ]),
    });

    return createdUser;
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
    @UserId() actorUserId: string,
    @common.Req() req: Request,
  ) {
    await this.service.updateRole(user_id, client_id, body);

    await this.logClientEvent(req, actorUserId, client_id, Actions.CLIENT_UPDATE, {
      target: user_id,
      action: 'client_user_role_updated',
      role: body.role,
    });
  }

  @common.HttpCode(common.HttpStatus.NO_CONTENT)
  @common.Delete(':client_id/users/:user_id/role')
  @swagger.ApiOperation({ summary: 'Delete a user role in an application' })
  @Scope(ClientActions.updateRole)
  async deleteRole(
    @common.Param('user_id') user_id: string,
    @common.Param('client_id') client_id: string,
    @UserId() actorUserId: string,
    @common.Req() req: Request,
  ) {
    await this.service.deleteRole(user_id, client_id);

    await this.logClientEvent(req, actorUserId, client_id, Actions.CLIENT_UPDATE, {
      target: user_id,
      action: 'client_user_role_deleted',
    });
  }

  @common.HttpCode(common.HttpStatus.NO_CONTENT)
  @common.Put(':client_id/users/:user_id/block')
  @swagger.ApiOperation({ summary: 'Block a user in an application' })
  @Scope(ClientActions.updateRole)
  async blockUser(
    @common.Param('user_id') user_id: string,
    @common.Param('client_id') client_id: string,
    @UserId() actorUserId: string,
    @common.Req() req: Request,
  ) {
    if (user_id === actorUserId) {
      throw new common.BadRequestException(Ei18nCodes.T3E0022);
    }

    await this.service.blockUser(user_id, client_id, actorUserId);

    await this.logClientEvent(req, actorUserId, client_id, Actions.USER_BLOCK, {
      target: user_id,
    });
  }

  @common.HttpCode(common.HttpStatus.NO_CONTENT)
  @common.Put(':client_id/users/:user_id/unblock')
  @swagger.ApiOperation({ summary: 'Unblock a user in an application' })
  @Scope(ClientActions.updateRole)
  async unblockUser(
    @common.Param('user_id') user_id: string,
    @common.Param('client_id') client_id: string,
    @UserId() actorUserId: string,
    @common.Req() req: Request,
  ) {
    if (user_id === actorUserId) {
      throw new common.BadRequestException(Ei18nCodes.T3E0022);
    }

    await this.service.unblockUser(user_id, client_id, actorUserId);

    await this.logClientEvent(req, actorUserId, client_id, Actions.USER_UNBLOCK, {
      target: user_id,
    });
  }

  @common.HttpCode(common.HttpStatus.NO_CONTENT)
  @common.Post(':client_id/users/:user_id/internal')
  @swagger.ApiOperation({ summary: 'Add a user to the internal system list' })
  @Scope(ClientActions.updateRole)
  async addUserToInternalList(
    @common.Param('user_id') user_id: string,
    @common.Param('client_id') client_id: string,
    @UserId() actorUserId: string,
    @common.Req() req: Request,
  ) {
    await this.service.addUserToInternalList(user_id, client_id, actorUserId);

    await this.logClientEvent(req, actorUserId, client_id, Actions.CLIENT_UPDATE, {
      target: user_id,
      action: 'client_user_added_to_internal_list',
    });
  }

  @common.HttpCode(common.HttpStatus.NO_CONTENT)
  @common.Delete(':client_id/users/:user_id/internal')
  @swagger.ApiOperation({ summary: 'Remove a user from the internal system list' })
  @Scope(ClientActions.updateRole)
  async removeUserFromInternalList(
    @common.Param('user_id') user_id: string,
    @common.Param('client_id') client_id: string,
    @UserId() actorUserId: string,
    @common.Req() req: Request,
  ) {
    await this.service.removeUserFromInternalList(user_id, client_id, actorUserId);

    await this.logClientEvent(req, actorUserId, client_id, Actions.CLIENT_UPDATE, {
      target: user_id,
      action: 'client_user_removed_from_internal_list',
    });
  }

  @common.HttpCode(common.HttpStatus.NO_CONTENT)
  @common.Delete(':client_id/users/:user_id/organization-list')
  @swagger.ApiOperation({ summary: 'Remove a user from the organization list' })
  @Scope(ClientActions.updateRole)
  async removeUserFromOrganizationList(
    @common.Param('user_id') user_id: string,
    @common.Param('client_id') client_id: string,
    @UserId() actorUserId: string,
    @common.Req() req: Request,
  ) {
    await this.service.removeUserFromOrganizationList(user_id, client_id, actorUserId);

    await this.logClientEvent(req, actorUserId, client_id, Actions.CLIENT_UPDATE, {
      target: user_id,
      action: 'client_user_removed_from_organization_list',
    });
  }

  @common.Post(':client_id/rules/:rule_id')
  @swagger.ApiOperation({ summary: 'Add a rule to an application' })
  @Scope(ClientActions.write)
  async addRuleValidationToRule(
    @common.Param('client_id') client_id: string,
    @common.Param('rule_id') rule_id: string,
    @UserId() userId: string,
    @common.Req() req: Request,
  ) {
    await this.service.addRule(client_id, rule_id);

    await this.logClientEvent(req, userId, client_id, Actions.CLIENT_UPDATE, {
      target: client_id,
      action: 'client_rule_added',
      rule_id,
    });
  }

  @common.Delete(':client_id/rules/:rule_id')
  @common.HttpCode(204)
  @swagger.ApiOperation({ summary: 'Remove a rule from an application' })
  @Scope(ClientActions.write)
  async deleteRuleValidationFromRule(
    @common.Param('client_id') client_id: string,
    @common.Param('rule_id') rule_id: string,
    @UserId() userId: string,
    @common.Req() req: Request,
  ) {
    await this.service.deleteRule(client_id, rule_id);

    await this.logClientEvent(req, userId, client_id, Actions.CLIENT_UPDATE, {
      target: client_id,
      action: 'client_rule_deleted',
      rule_id,
    });
  }
}
