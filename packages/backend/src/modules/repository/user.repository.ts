import { BadRequestException, Injectable } from '@nestjs/common';
import { Ei18nCodes, IdentifierType } from 'src/enums';
import { getIdentifierType, prepareIdentifier } from '../../helpers';
import { prisma } from '../prisma/prisma.client';
import {
  buildLegacyIdentifierWhere,
  legacyUserInclude,
  LegacyUserModel,
  toLegacyUser,
} from './user-compat';
import {
  legacyUserEmailExternalAccountTypes,
  legacyUserPhoneExternalAccountTypes,
} from './user-search';

export type UserModel = LegacyUserModel;

@Injectable()
export class UserRepository {
  public async findByIdentifier({
    identifier,
    identifierType,
  }: {
    identifier: string | number;
    identifierType?: IdentifierType;
  }): Promise<UserModel | null> {
    let type = identifierType;
    if (!type) {
      type = typeof identifier === 'string' ? getIdentifierType(identifier) : IdentifierType.ID;
    }

    const preparedIdentifier =
      typeof identifier === 'string' ? prepareIdentifier(identifier, type) : identifier;

    const where =
      type === IdentifierType.Email
        ? {
            externalAccounts: {
              some: {
                sub: String(preparedIdentifier),
                type: {
                  in: [...legacyUserEmailExternalAccountTypes],
                },
              },
            },
          }
        : type === IdentifierType.PhoneNumber
        ? {
            externalAccounts: {
              some: {
                sub: String(preparedIdentifier),
                type: {
                  in: [...legacyUserPhoneExternalAccountTypes],
                },
              },
            },
          }
        : buildLegacyIdentifierWhere(String(preparedIdentifier), type);

    if (type === IdentifierType.Email) {
      const count = await prisma.user.count({
        where,
      });

      if (count > 1) {
        throw new BadRequestException(Ei18nCodes.T3E0032);
      }
    }

    const user = await prisma.user.findFirst({
      where,
      include: legacyUserInclude,
    });

    return toLegacyUser(user);
  }

  public async findById(user_id: string): Promise<UserModel | null> {
    const user = await prisma.user.findUnique({
      where: { id: String(user_id) },
      include: legacyUserInclude,
    });

    return toLegacyUser(user);
  }
}
