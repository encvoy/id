import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DefaultArgs } from '@prisma/client/runtime/library';
import { ListInputDto } from 'src/custom.dto';
import { Ei18nCodes } from 'src/enums';
import { prisma } from '../prisma/prisma.client';
import { SettingsService } from '../settings/settings.service';

export const SettingsCatalogName = 'catalog';

@Injectable()
export class CatalogService {
  constructor(private readonly settingsService: SettingsService) {}

  /**
   * Получение списка публичных приложений согласно фильтрам
   */
  public async catalog(params: ListInputDto, user_id: string) {
    await this.checkEnabled();

    const { filter, limit, sortBy, sortDirection, offset, search } = params;

    const findParams: Prisma.ClientFindManyArgs<DefaultArgs> = {
      where: {
        ...filter,
        catalog: true,
        parent_id: { not: null },
        OR: [
          { name: { contains: search || '', mode: 'insensitive' } },
          { description: { contains: search || '', mode: 'insensitive' } },
        ],
      },
      select: {
        client_id: true,
        name: true,
        description: true,
        domain: true,
        avatar: true,
        created_at: true,
        type: true,
        favorite_clients: {
          where: {
            user_id: parseInt(user_id, 10),
          },
          select: {
            id: true,
          },
        },
      },
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortDirection },
    };

    const [clients, totalCount] = await Promise.all([
      prisma.client.findMany(findParams),
      prisma.client.count({ where: findParams.where }),
    ]);

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
