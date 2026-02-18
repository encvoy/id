import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { prisma } from '../prisma/prisma.client';

export type ExternalAccountModel = Prisma.ExternalAccountGetPayload<{
  select: Prisma.ExternalAccountSelect;
}>;

@Injectable()
export class ExternalAccountRepository {
  public async findBySubIssuer(sub: string, issuer: string, select?: Prisma.ExternalAccountSelect) {
    return prisma.externalAccount.findFirst({
      where: { sub, issuer },
      select,
    });
  }
}
