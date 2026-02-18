import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DefaultArgs } from '@prisma/client/runtime/library';
import { CLIENT_ID } from 'src/constants';
import { ListInputDto } from 'src/custom.dto';
import { Ei18nCodes } from 'src/enums';
import { prisma } from '../prisma/prisma.client';

@Injectable()
export class ScopeService {
  /**
   * Getting a list of application permissions according to filters
   */
  public async list(params: ListInputDto, user_id: string) {
    const { filter, limit, sortBy, sortDirection, offset, search } = params;

    // Generate request parameters
    const findParams: Prisma.ScopesFindManyArgs<DefaultArgs> = {
      where: {
        ...filter,
        scopes: { not: '' },
        user_id: parseInt(user_id, 10),
        client: {
          client_id: { not: CLIENT_ID },
          OR: [
            { name: { contains: search || '', mode: 'insensitive' } },
            { description: { contains: search || '', mode: 'insensitive' } },
          ],
        },
      },
      select: {
        id: true,
        client_id: true,
        scopes: true,
        created_at: true,
        client: {
          select: {
            client_id: true,
            name: true,
            description: true,
            domain: true,
            avatar: true,
            type: true,
            created_at: true,
          },
        },
      },
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortDirection },
    };

    // Get a list of permissions and the total number (necessary for working with the list)
    const [scopes, totalCount] = await Promise.all([
      prisma.scopes.findMany(findParams),
      prisma.scopes.count({ where: findParams.where }),
    ]);

    // Transform the data for ease of use
    const scopesList = scopes.map((scope) => {
      return {
        id: scope.id,
        client_id: scope.client_id,
        scopes: scope.scopes ? scope.scopes.split(' ') : [],
        created_at: scope.created_at,
        client: (scope as any).client,
      };
    });

    return { scopes: scopesList, totalCount };
  }

  /**
   * Revoking permissions for the specified clients
   */
  public async delete(client_ids: string[], user_id: string) {
    if (client_ids.includes(CLIENT_ID)) {
      throw new BadRequestException(Ei18nCodes.T3E0026);
    }

    // Remove all permissions for the specified clients
    await prisma.scopes.deleteMany({
      where: {
        user_id: parseInt(user_id, 10),
        client_id: { in: client_ids },
      },
    });
  }
}
