import { BadRequestException, Injectable } from '@nestjs/common';
import { prisma } from '../prisma/prisma.client';
import { Ei18nCodes } from 'src/enums';

@Injectable()
export class AvatarService {
  async getAvatar(hashed_email: string) {
    const users = await prisma.user.findMany({
      where: {
        ExternalAccount: {
          some: {
            OR: [{ hashed_email }, { hashed_email_md5: hashed_email }],
          },
        },
      },
      select: {
        ExternalAccount: {
          where: {
            OR: [{ hashed_email }, { hashed_email_md5: hashed_email }],
          },
        },
        picture: true,
      },
    });
    if (users.length > 1) throw new BadRequestException(Ei18nCodes.T3E0032);
    const user = users[0];
    const avatar = user?.picture;

    if (user!.ExternalAccount[0].public !== 2 || !avatar)
      throw new BadRequestException(Ei18nCodes.T3E0058);

    return avatar;
  }
}
