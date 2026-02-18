import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, Provider } from '@prisma/client';
import { Request, Response } from 'express';
import { prisma } from 'src/modules/prisma/prisma.client';
import { ProviderMethod } from '../../providers.decorators';
import { EmailService, MailCodeTypes, TEmailProvider } from '../email';
import {
  CreateEmailCustomProviderDto,
  UpdateEmailCustomProviderDto,
  VerificationSendCodeEmailCustomDTO,
} from './emailc.dto';
import { Ei18nCodes } from 'src/enums';

export const PROVIDER_TYPE_EMAIL_CUSTOM = 'EMAIL_CUSTOM';

@Injectable()
export class EmailCustomService extends EmailService {
  defaultUrlAvatar: string = 'public/default/email.svg';
  type = PROVIDER_TYPE_EMAIL_CUSTOM;

  @ProviderMethod(CreateEmailCustomProviderDto)
  async onCreate(
    params: CreateEmailCustomProviderDto | any,
    client_id: string,
    user_id: string,
  ): Promise<Prisma.ProviderCreateInput> {
    return this.prepareProviderCreateInput(client_id, params);
  }

  @ProviderMethod(UpdateEmailCustomProviderDto)
  async onUpdate(
    params: UpdateEmailCustomProviderDto | any,
    provider: Provider,
    client_id: string,
    user_id: string,
  ): Promise<Prisma.ProviderUpdateInput> {
    return this.prepareProviderUpdateInput(params);
  }

  @ProviderMethod(VerificationSendCodeEmailCustomDTO)
  async verificationCode(
    params: VerificationSendCodeEmailCustomDTO | any,
    req: Request,
    res: Response,
  ) {
    const { name: app_name } = await prisma.client.findUnique({
      where: { client_id: params.client_id },
    });

    const { provider } = await prisma.provider_relations.findFirst({
      where: {
        client_id: params.client_id,
        provider_id: parseInt(params.provider_id, 10),
        provider: {
          type: this.type,
        },
      },
      include: { provider: true },
    });
    if (!provider) throw new BadRequestException(Ei18nCodes.T3E0030);

    const users = await prisma.user.findMany({
      where: { email: params.email },
    });
    if (users.length > 1) {
      throw new BadRequestException(Ei18nCodes.T3E0032);
    }

    await this.sendCodeByType(
      {
        ...params,
        app_name,
        code_type: MailCodeTypes.confirmEmail,
      },
      provider as TEmailProvider,
    );

    return;
  }
}
