import * as common from '@nestjs/common';
import * as swagger from '@nestjs/swagger';
import { Request } from 'express';
import { Scope, UserId } from '../../decorators';
import { Actions } from '../../enums';
import { CustomLogger } from '../logger';
import { TransferClientOwnerDto } from '../clients/clients.dto';
import { ClientActions } from '../clients/clients.roles';
import { OrganizationsService } from './organizations.service';

@common.Controller('v1/organizations')
@swagger.ApiBearerAuth()
export class OrganizationsController {
  constructor(
    private readonly service: OrganizationsService,
    private readonly logger: CustomLogger,
  ) {}

  private async logOrganizationEvent(
    req: Request,
    userId: string | null | undefined,
    organizationId: string,
    event: Actions,
    details: object,
  ) {
    await this.logger.logEvent({
      ip_address: req.ip,
      device: req.headers['user-agent'],
      user_id: userId,
      client_id: organizationId,
      event,
      description: '',
      details,
    });
  }

  @common.Post()
  @swagger.ApiOperation({ summary: 'Create an organization' })
  @Scope(ClientActions.createOrg)
  async create(@UserId() userId: string, @common.Req() req: Request) {
    const result = await this.service.create(userId);

    await this.logOrganizationEvent(req, userId, result.orgId, Actions.CLIENT_CREATE, {
      target: result.orgId,
      action: 'client_organization_created',
    });

    return result;
  }

  @common.Put(':client_id/owner')
  @swagger.ApiOperation({ summary: 'Transfer organization owner' })
  @Scope(ClientActions.updateRole)
  async transferOwner(
    @common.Body() body: TransferClientOwnerDto,
    @common.Param('client_id') organizationId: string,
    @UserId() userId: string,
    @common.Req() req: Request,
  ) {
    await this.service.transferOwner(organizationId, body.user_id, userId);

    await this.logOrganizationEvent(req, userId, organizationId, Actions.CLIENT_UPDATE, {
      target: organizationId,
      action: 'client_owner_transferred',
      changed_fields: ['owner'],
    });
  }

  @common.Delete(':client_id')
  @swagger.ApiOperation({ summary: 'Delete an organization' })
  @Scope(ClientActions.delete)
  async delete(
    @common.Param('client_id') organizationId: string,
    @UserId() userId: string,
    @common.Req() req: Request,
  ) {
    await this.service.delete(organizationId);

    await this.logOrganizationEvent(req, userId, organizationId, Actions.CLIENT_DELETE, {
      target: organizationId,
    });
  }
}
