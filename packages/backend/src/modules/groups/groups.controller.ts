import * as common from '@nestjs/common';
import * as swagger from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Scope, UserId } from 'src/decorators';
import { prepareListResponse } from 'src/helpers';
import { Actions } from '../../enums';
import { CustomLogger } from '../logger';
import * as dto from './groups.dto';
import { GroupsActions } from './groups.roles';
import { GroupsService } from './groups.service';

const getDefinedKeys = <T extends object>(payload: T, excludedKeys: string[] = []) =>
  Object.entries(payload as Record<string, unknown>)
    .filter(([key, value]) => value !== undefined && !excludedKeys.includes(key))
    .map(([key]) => key);

@common.Controller('v1/organizations/:organization_id')
@swagger.ApiBasicAuth()
@swagger.ApiBearerAuth()
@swagger.ApiTags('Groups')
export class GroupsController {
  constructor(
    private readonly service: GroupsService,
    private readonly logger: CustomLogger,
  ) {}

  @common.Post('groups')
  @swagger.ApiOperation({ summary: 'Create organization group' })
  @Scope(GroupsActions.groups_write)
  async createGroup(
    @common.Param('organization_id') organization_id: string,
    @common.Body() createDto: dto.CreateGroupDto,
    @UserId() userId: string,
    @common.Req() req: Request,
  ) {
    const group = await this.service.createGroup(organization_id, createDto);

    await this.logger.logEvent({
      ip_address: req.ip,
      device: req.headers['user-agent'],
      user_id: userId,
      client_id: organization_id,
      event: Actions.ORGANIZATION_GROUP_CREATE,
      description: '',
      details: {
        target: group.id,
        changed_fields: getDefinedKeys(createDto),
      },
    });

    return group;
  }

  @common.Get('groups')
  @swagger.ApiOperation({ summary: 'Get organization groups' })
  @Scope(GroupsActions.groups_read)
  async getGroups(
    @common.Param('organization_id') organization_id: string,
    @common.Query() params: dto.ListGroupsDto,
    @common.Res() res: Response,
  ) {
    const { groups, totalCount } = await this.service.getGroups(organization_id, params);
    return prepareListResponse(res, groups, totalCount, params);
  }

  @common.Put('groups/:group_id')
  @swagger.ApiOperation({ summary: 'Update organization group' })
  @Scope(GroupsActions.groups_write)
  async updateGroup(
    @common.Param('organization_id') organization_id: string,
    @common.Param('group_id') group_id: string,
    @common.Body() updateDto: dto.UpdateGroupDto,
    @UserId() userId: string,
    @common.Req() req: Request,
  ) {
    const group = await this.service.updateGroup(organization_id, group_id, updateDto);

    await this.logger.logEvent({
      ip_address: req.ip,
      device: req.headers['user-agent'],
      user_id: userId,
      client_id: organization_id,
      event: Actions.ORGANIZATION_GROUP_UPDATE,
      description: '',
      details: {
        target: group_id,
        changed_fields: getDefinedKeys(updateDto),
      },
    });

    return group;
  }

  @common.Delete('groups/:group_id')
  @swagger.ApiOperation({ summary: 'Delete organization group' })
  @Scope(GroupsActions.groups_delete)
  async deleteGroup(
    @common.Param('organization_id') organization_id: string,
    @common.Param('group_id') group_id: string,
    @UserId() userId: string,
    @common.Req() req: Request,
  ) {
    const result = await this.service.deleteGroup(organization_id, group_id);

    await this.logger.logEvent({
      ip_address: req.ip,
      device: req.headers['user-agent'],
      user_id: userId,
      client_id: organization_id,
      event: Actions.ORGANIZATION_GROUP_DELETE,
      description: '',
      details: {
        target: group_id,
      },
    });

    return result;
  }

  @common.Get('groups/:group_id/users')
  @swagger.ApiOperation({ summary: 'Get organization group users' })
  @Scope(GroupsActions.groups_read)
  async getGroupUsers(
    @common.Param('organization_id') organization_id: string,
    @common.Param('group_id') group_id: string,
    @common.Query() params: dto.ListGroupUsersDto,
    @common.Res() res: Response,
  ) {
    const { users, totalCount } = await this.service.getGroupUsers(
      organization_id,
      group_id,
      params,
    );
    return prepareListResponse(res, users, totalCount, params);
  }

  @common.Post('groups/:group_id/users')
  @swagger.ApiOperation({ summary: 'Add user to organization group' })
  @Scope(GroupsActions.groups_write)
  async addGroupUser(
    @common.Param('organization_id') organization_id: string,
    @common.Param('group_id') group_id: string,
    @common.Body() addDto: dto.AddGroupUserDto,
    @UserId() userId: string,
    @common.Req() req: Request,
  ) {
    const result = await this.service.addGroupUser(organization_id, group_id, addDto.user_id);

    await this.logger.logEvent({
      ip_address: req.ip,
      device: req.headers['user-agent'],
      user_id: userId,
      client_id: organization_id,
      event: Actions.ORGANIZATION_GROUP_MEMBER_ADD,
      description: '',
      details: {
        target: group_id,
        user_id: addDto.user_id,
      },
    });

    return result;
  }

  @common.Delete('groups/:group_id/users/:member_user_id')
  @swagger.ApiOperation({ summary: 'Remove user from organization group' })
  @Scope(GroupsActions.groups_write)
  async removeGroupUser(
    @common.Param('organization_id') organization_id: string,
    @common.Param('group_id') group_id: string,
    @common.Param('member_user_id') member_user_id: string,
    @UserId() userId: string,
    @common.Req() req: Request,
  ) {
    const result = await this.service.removeGroupUser(organization_id, group_id, member_user_id);

    await this.logger.logEvent({
      ip_address: req.ip,
      device: req.headers['user-agent'],
      user_id: userId,
      client_id: organization_id,
      event: Actions.ORGANIZATION_GROUP_MEMBER_REMOVE,
      description: '',
      details: {
        target: group_id,
        user_id: member_user_id,
      },
    });

    return result;
  }

  @common.Get('clients/:client_id/access-groups')
  @swagger.ApiOperation({ summary: 'Get application access groups' })
  @Scope(GroupsActions.application_access_groups_read)
  async getApplicationAccessGroups(
    @common.Param('organization_id') organization_id: string,
    @common.Param('client_id') client_id: string,
    @common.Query() params: dto.ListApplicationAccessGroupsDto,
    @common.Res() res: Response,
  ) {
    const { groups, totalCount } = await this.service.getApplicationAccessGroups(
      organization_id,
      client_id,
      params,
    );
    return prepareListResponse(res, groups, totalCount, params);
  }

  @common.Post('clients/:client_id/access-groups/:group_id')
  @swagger.ApiOperation({ summary: 'Add group to application access list' })
  @Scope(GroupsActions.application_access_groups_write)
  async addApplicationAccessGroup(
    @common.Param('organization_id') organization_id: string,
    @common.Param('client_id') client_id: string,
    @common.Param('group_id') group_id: string,
    @UserId() actorUserId: string,
    @common.Req() req: Request,
  ) {
    const result = await this.service.addApplicationAccessGroup(
      organization_id,
      client_id,
      group_id,
      actorUserId,
    );

    await this.logger.logEvent({
      ip_address: req.ip,
      device: req.headers['user-agent'],
      user_id: actorUserId,
      client_id: organization_id,
      event: Actions.APPLICATION_ACCESS_GROUP_ADD,
      description: '',
      details: {
        target: client_id,
        group_id,
      },
    });

    return result;
  }

  @common.Delete('clients/:client_id/access-groups/:group_id')
  @swagger.ApiOperation({ summary: 'Remove group from application access list' })
  @Scope(GroupsActions.application_access_groups_write)
  async removeApplicationAccessGroup(
    @common.Param('organization_id') organization_id: string,
    @common.Param('client_id') client_id: string,
    @common.Param('group_id') group_id: string,
    @UserId() userId: string,
    @common.Req() req: Request,
  ) {
    const result = await this.service.removeApplicationAccessGroup(
      organization_id,
      client_id,
      group_id,
    );

    await this.logger.logEvent({
      ip_address: req.ip,
      device: req.headers['user-agent'],
      user_id: userId,
      client_id: organization_id,
      event: Actions.APPLICATION_ACCESS_GROUP_REMOVE,
      description: '',
      details: {
        target: client_id,
        group_id,
      },
    });

    return result;
  }

  @common.Put('clients/:client_id/access-groups')
  @swagger.ApiOperation({ summary: 'Replace application access groups' })
  @Scope(GroupsActions.application_access_groups_write)
  async replaceApplicationAccessGroups(
    @common.Param('organization_id') organization_id: string,
    @common.Param('client_id') client_id: string,
    @common.Body() body: dto.ReplaceApplicationAccessGroupsDto,
    @UserId() actorUserId: string,
    @common.Req() req: Request,
  ) {
    const result = await this.service.replaceApplicationAccessGroups(
      organization_id,
      client_id,
      body.group_ids,
      actorUserId,
    );

    await this.logger.logEvent({
      ip_address: req.ip,
      device: req.headers['user-agent'],
      user_id: actorUserId,
      client_id: organization_id,
      event: Actions.APPLICATION_ACCESS_GROUP_REPLACE,
      description: '',
      details: {
        target: client_id,
        group_ids: body.group_ids,
      },
    });

    return result;
  }
}
