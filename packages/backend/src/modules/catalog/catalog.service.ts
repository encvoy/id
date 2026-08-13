import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DefaultArgs } from '@prisma/client/runtime/library';
import { CLIENT_ID } from 'src/constants';
import { ListInputDto } from 'src/custom.dto';
import { Ei18nCodes, SortDirection } from 'src/enums';
import {
  buildClientNameSearchConditions,
  buildLocalizedClientFieldSearchConditions,
  getClientCatalogDisplayName,
  getLocalizedClientSortContext,
  sortItemsByLocalizedClientName,
} from 'src/utils/localized-client-name';
import { prisma } from '../prisma/prisma.client';
import { SettingsService } from '../settings/settings.service';

export const SettingsCatalogName = 'catalog';

@Injectable()
export class CatalogService {
  constructor(private readonly settingsService: SettingsService) {}

  public async catalog(params: ListInputDto, user_id: string, org_id: string | null) {
    await this.checkEnabled();

    const { filter, limit, sortBy, sortDirection, offset, search } = params;
    const searchValue = search?.trim();
    const accessibleOrganizationIds = await this.getAccessibleOrganizationIds(user_id, org_id);
    const accessConditions: Prisma.ClientWhereInput[] = [
      { parent_id: CLIENT_ID },
    ];

    for (const organizationId of accessibleOrganizationIds) {
      accessConditions.push({
        client_id: organizationId,
        parent_id: null,
      });
      accessConditions.push({
        parent_id: organizationId,
      });
    }

    const where: Prisma.ClientWhereInput = {
      catalog: true,
      AND: [
        filter || {},
        {
          OR: accessConditions,
        },
        ...(searchValue
          ? [
              {
                OR: [
                  ...buildClientNameSearchConditions(searchValue),
                  ...buildLocalizedClientFieldSearchConditions('catalog_name', searchValue),
                  { description: { contains: searchValue, mode: 'insensitive' } },
                ],
              },
            ]
          : []),
      ],
    };

    const findParams: Prisma.ClientFindManyArgs<DefaultArgs> = {
      where,
      select: {
        client_id: true,
        name: true,
        catalog_name: true,
        description: true,
        domain: true,
        avatar: true,
        created_at: true,
        type: true,
        favorite_clients: {
          where: {
            user_id,
          },
          select: {
            id: true,
          },
        },
      },
    };

    let clients;
    let totalCount: number;

    if (sortBy === 'name') {
      const sortContext = await getLocalizedClientSortContext();
      const matchedClients = await prisma.client.findMany(findParams);
      const sortedClients = sortItemsByLocalizedClientName(matchedClients, {
        sortDirection: sortDirection || SortDirection.ASC,
        sortContext,
        getClientName: (client) => getClientCatalogDisplayName(client),
        getClientId: (client) => client.client_id,
      });
      const safeOffset = offset && offset > 0 ? offset : 0;
      const end = typeof limit === 'number' ? safeOffset + limit : undefined;

      clients = sortedClients.slice(safeOffset, end);
      totalCount = sortedClients.length;
    } else {
      [clients, totalCount] = await Promise.all([
        prisma.client.findMany({
          ...findParams,
          take: limit,
          skip: offset,
          orderBy: sortBy ? { [sortBy]: sortDirection } : undefined,
        }),
        prisma.client.count({ where }),
      ]);
    }

    return {
      clients: clients.map((client) => ({
        ...client,
        favorite: client['favorite_clients'].length > 0,
      })),
      totalCount,
    };
  }

  public async getCatalogEnabled() {
    return this.settingsService.getSettingsByName<boolean>(SettingsCatalogName);
  }

  private async getAccessibleOrganizationIds(user_id: string, org_id: string | null) {
    const organizationIds = new Set<string>();

    if (org_id && org_id !== CLIENT_ID) {
      organizationIds.add(org_id);
    }

    const organizationRoles = await prisma.role.findMany({
      where: {
        user_id,
        client_id: {
          not: CLIENT_ID,
        },
        client: {
          parent_id: null,
        },
      },
      select: {
        client_id: true,
      },
    });

    for (const role of organizationRoles) {
      organizationIds.add(role.client_id);
    }

    return organizationIds;
  }

  private async checkEnabled() {
    const ok = await this.getCatalogEnabled();
    if (!ok) {
      throw new BadRequestException(Ei18nCodes.T3E0056);
    }
  }

  async updateCatalogEnabled(enabled: boolean) {
    await this.settingsService.updateSettings({ name: SettingsCatalogName, value: enabled });
  }
}
