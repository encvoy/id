import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CLIENT_ID } from 'src/constants';
import { Ei18nCodes } from 'src/enums';
import { ClientService } from '../clients/clients.service';
import { prisma } from '../prisma/prisma.client';

@Injectable()
export class OrganizationsService {
  constructor(private readonly clientService: ClientService) {}

  private async assertOrganizationClient(clientId: string) {
    const client = await prisma.client.findUnique({
      where: { client_id: clientId },
      select: {
        client_id: true,
        parent_id: true,
      },
    });

    if (!client) {
      throw new NotFoundException(Ei18nCodes.T3E0071);
    }

    if (client.client_id === CLIENT_ID || client.parent_id !== null) {
      throw new BadRequestException(Ei18nCodes.T3E0026);
    }
  }

  create(userId: string) {
    return this.clientService.createOrganization(userId);
  }

  async transferOwner(organizationId: string, targetUserId: string, actorUserId?: string) {
    await this.assertOrganizationClient(organizationId);
    return this.clientService.transferOwner(organizationId, targetUserId, actorUserId);
  }

  async delete(organizationId: string) {
    await this.assertOrganizationClient(organizationId);
    return this.clientService.delete(organizationId);
  }
}
