import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Ei18nCodes, IdentifierType } from 'src/enums';
import { getIdentifierType, prepareIdentifier } from '../../helpers';
import { prisma } from '../prisma/prisma.client';

export type UserModel = Prisma.UserGetPayload<{ select: Prisma.UserSelect }>;

@Injectable()
export class UserRepository {
  public async findByIdentifier({
    identifier,
    identifierType,
    select,
  }: {
    identifier: string | number;
    identifierType?: IdentifierType;
    select?: Prisma.UserSelect;
  }): Promise<UserModel | null> {
    let type = identifierType;
    if (!type) {
      type = typeof identifier === 'string' ? getIdentifierType(identifier) : IdentifierType.ID;
    }

    if (type === IdentifierType.Email) {
      const count = await prisma.user.count({
        where: {
          email: identifier.toString(),
        },
      });

      if (count > 1) {
        throw new BadRequestException(Ei18nCodes.T3E0032);
      }
    }

    const preparedIdentifier =
      typeof identifier === 'string' ? prepareIdentifier(identifier, type) : identifier;

    return prisma.user.findFirst({
      where: {
        [type]:
          typeof preparedIdentifier === 'number'
            ? preparedIdentifier
            : { equals: preparedIdentifier },
      },
      select,
    });
  }

  public async findById(
    user_id: number | string,
    select?: Prisma.UserSelect,
  ): Promise<UserModel | null> {
    const id = typeof user_id === 'string' ? parseInt(user_id, 10) : user_id;

    return prisma.user.findUnique({
      where: { id },
      select,
    });
  }
}
