import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InvitationService } from './invitation.service';
import { ListInputDto } from 'src/custom.dto';
import { Scope, UserId } from 'src/decorators';
import { InvitationActions } from './invitation.roles';
import { prepareListResponse } from 'src/helpers';
import { Response, Request } from 'express';
import { CreateInvitationDto } from './invitation.dto';
import { CustomLogger } from '../logger';
import { Actions } from 'src/enums';

@Controller('v1')
@ApiBearerAuth()
export class InvitationController {
  constructor(private readonly service: InvitationService, private readonly logger: CustomLogger) {}

  @Get('clients/:client_id/invitations')
  @ApiOperation({ summary: 'Get a list of client invitations' })
  @Scope(InvitationActions.getAllByClient)
  async getAllByClient(
    @Query() params: ListInputDto,
    @Param('client_id') client_id: string,
    @Res() res: Response,
  ) {
    const { items, totalCount } = await this.service.getAllByClient(client_id, params);
    return prepareListResponse(res, items, totalCount, params);
  }

  @Post('clients/:client_id/invitations')
  @ApiOperation({ summary: 'Create an invitation' })
  @Scope(InvitationActions.create)
  async create(
    @Param('client_id') client_id: string,
    @Body() body: CreateInvitationDto,
    @UserId() user_id: string,
    @Req() req: Request,
  ) {
    const res = this.service.create(body, client_id);

    await this.logger.logEvent({
      ip_address: req.ip,
      device: req.headers['user-agent'],
      user_id,
      client_id,
      event: Actions.INVITATION_CREATE,
      description: '',
      details: { target: body.email },
    });

    return res;
  }

  @Delete('clients/:client_id/invitations/:invitation_id')
  @Scope(InvitationActions.deleteClient)
  async deleteByClient(
    @Param('client_id') client_id: string,
    @Param('invitation_id') invitation_id: string,
    @UserId() user_id: string,
    @Req() req: Request,
  ) {
    const inv = await this.service.deleteByClient(client_id, invitation_id);
    if (!inv) return;

    await this.logger.logEvent({
      ip_address: req.ip,
      device: req.headers['user-agent'],
      user_id,
      client_id,
      event: Actions.INVITATION_DELETE,
      description: '',
      details: { target: inv.email },
    });
    return;
  }

  @Get('users/:user_id/invitations')
  @ApiOperation({ summary: 'Get a list of user invitations' })
  @Scope(InvitationActions.getAllByUser)
  async getAllByUser(
    @Query() params: ListInputDto,
    @UserId() user_id: string,
    @Res() res: Response,
  ) {
    const { items, totalCount } = await this.service.getAllByUser(user_id, params);
    return prepareListResponse(res, items, totalCount, params);
  }

  @Delete('users/:user_id/invitations/:invitation_id')
  @Scope(InvitationActions.deleteUser)
  async deleteByUser(
    @Param('invitation_id') invitation_id: string,
    @UserId() user_id: string,
    @Req() req: Request,
  ) {
    const inv = await this.service.deleteByUser(user_id, invitation_id);
    if (!inv) return;

    await this.logger.logEvent({
      ip_address: req.ip,
      device: req.headers['user-agent'],
      user_id,
      client_id: inv.client_id,
      event: Actions.INVITATION_DELETE,
      description: '',
      details: { target: inv.email },
    });
    return;
  }

  @Put('users/:user_id/invitations/:invitation_id')
  @Scope(InvitationActions.confirmUser)
  async confirmByUser(
    @Param('invitation_id') invitation_id: string,
    @UserId() user_id: string,
    @Req() req: Request,
  ) {
    const inv = await this.service.confirmByUser(user_id, invitation_id);
    if (!inv) return;

    await this.logger.logEvent({
      ip_address: req.ip,
      device: req.headers['user-agent'],
      user_id,
      client_id: inv.client_id,
      event: Actions.INVITATION_CONFIRM,
      description: '',
      details: { target: inv.email },
    });
    return;
  }
}
