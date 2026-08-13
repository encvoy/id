import { BadRequestException, Injectable } from '@nestjs/common';
import { prisma } from '../prisma/prisma.client';
import { Ei18nCodes } from 'src/enums';
import { legacyUserInclude, toLegacyUser } from '../repository/user-compat';

@Injectable()
export class AvatarService {
  async getAvatar(hashed_email: string) {
    const accounts = await prisma.externalAccount.findMany({
      where: {
        OR: [{ hashed_email }, { hashed_email_md5: hashed_email }],
      },
      include: {
        user: {
          include: legacyUserInclude,
        },
      },
    });
    if (accounts.length > 1) throw new BadRequestException(Ei18nCodes.T3E0032);

    const account = accounts[0];
    const user = account?.user ? toLegacyUser(account.user) : null;
    const avatar = user?.picture;

    if (account?.public !== 2 || !avatar) {
      throw new BadRequestException(Ei18nCodes.T3E0058);
    }

    return avatar;
  }
}
