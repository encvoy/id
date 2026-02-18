import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, Provider } from '@prisma/client';
import { Request, Response } from 'express';
import { Ei18nCodes, EProviderTypes } from 'src/enums';
import { prisma } from 'src/modules/prisma';
import { IAuthResponse } from '../../factory.service';
import { ProviderBase } from '../../provider.base';
import { ProviderMethod } from '../../providers.decorators';
import { KloudService } from '../kloud';
import {
  AuthByPhoneDto,
  CreatePhoneProviderDto,
  UpdatePhoneProviderDto,
  VerificationSendCodePhoneDTO,
  VerificationStatusPhoneDTO,
} from './phone.dto';
import { TPhoneProvider } from './phone.types';
import { REDIS_PREFIXES, RedisAdapter } from 'src/modules/redis/redis.adapter';

export const PROVIDER_TYPE_PHONE = 'PHONE';

@Injectable()
export class PhoneService extends ProviderBase {
  type = PROVIDER_TYPE_PHONE;
  defaultUrlAvatar: string = 'public/default/phone.svg';

  public constructor(private readonly kloudService: KloudService) {
    super();
  }

  userData = new RedisAdapter(REDIS_PREFIXES.UserData);

  syncUser(params: any, req: Request, res: Response): Promise<IAuthResponse> {
    throw new BadRequestException(Ei18nCodes.T3E0031);
  }
  onActivate(): Promise<void> {
    return;
  }

  onBindAccount(userId: string, params: any) {
    throw new BadRequestException(Ei18nCodes.T3E0031);
  }

  @ProviderMethod(AuthByPhoneDto)
  async onAuth(params: AuthByPhoneDto, uid: string, provider: Provider): Promise<IAuthResponse> {
    let data = await this.userData.find(uid);
    if (data?.phone_number !== params.phone_number) {
      await this.confirm(params.phone_number, params.code);
    }
    const user = await prisma.user.findUnique({
      where: {
        phone_number: params.phone_number,
      },
    });
    if (!user) {
      data = data || {};
      data.phone_number = params.phone_number;
      await this.userData.upsert(uid, data, 3600);
    }

    return { user };
  }

  @ProviderMethod(CreatePhoneProviderDto)
  async onCreate(
    params: CreatePhoneProviderDto,
    client_id: string,
    user_id: string,
  ): Promise<Prisma.ProviderCreateInput> {
    const uniqueProvider = await prisma.provider.findFirst({
      where: {
        client_id,
        type: this.type,
      },
    });

    if (uniqueProvider) {
      throw new BadRequestException(Ei18nCodes.T3E0036);
    }
    return this.prepareProviderCreateInput(client_id, params);
  }

  @ProviderMethod(UpdatePhoneProviderDto)
  async onUpdate(
    params: UpdatePhoneProviderDto,
    provider: Provider,
    client_id: string,
    user_id: string,
  ): Promise<Prisma.ProviderUpdateInput> {
    return this.prepareProviderUpdateInput(params);
  }

  @ProviderMethod(VerificationStatusPhoneDTO)
  async verificationStatus(params: VerificationStatusPhoneDTO) {
    if (!params.phone_number) throw new BadRequestException(Ei18nCodes.T3E0029);

    const resp = await prisma.externalAccount.findFirst({
      where: { sub: params.phone_number },
    });
    const resp2 = await prisma.user.findFirst({
      where: { phone_number: params.phone_number },
    });
    return { isExist: !!resp || !!resp2, uniqueRule: true };
  }

  @ProviderMethod(VerificationSendCodePhoneDTO)
  async verificationCode(
    params: VerificationSendCodePhoneDTO,
    req: Request,
    res: Response,
  ): Promise<any> {
    const phoneProvider = (await prisma.provider.findFirst({
      where: {
        type: EProviderTypes.PHONE,
      },
    })) as TPhoneProvider;

    const result = await this.kloudService
      .callKloud(phoneProvider, params.phone_number)
      .catch(() => {
        throw new BadRequestException(Ei18nCodes.T3E0097);
      });

    return result;
  }

  async confirm(phoneNumber: string, code: string) {
    await this.kloudService.confirm(phoneNumber, code);
  }

  async checkCode(phoneNumber: string, code: string) {
    await this.kloudService.checkCode(phoneNumber, code);
  }
}
