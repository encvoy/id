import { BadRequestException } from '@nestjs/common';
import { Injectable } from '@nestjs/common/decorators';
import { Prisma, Provider } from '@prisma/client';
import { Request, Response } from 'express';
import fetch from 'node-fetch';
import { isUrl } from 'src/helpers';
import { ProviderBase } from 'src/modules/providers/provider.base';
import { ProviderMethod } from 'src/modules/providers/providers.decorators';
import { REDIS_PREFIXES, RedisAdapter } from 'src/modules/redis';
import { ExternalAccountRepository } from 'src/modules/repository';
import { IAuthResponse } from '../../factory.service';
import {
  AuthByKloudDto,
  CreateKloudProviderDto,
  UpdateKloudProviderDto,
  VerificationSendCodeKloudDTO,
  VerificationStatusKloudDTO,
} from './kloud.dto';
import { TKloudProvider } from './kloud.types';
import { prisma } from 'src/modules/prisma';
import { Ei18nCodes } from 'src/enums';

@Injectable()
export class KloudService extends ProviderBase {
  defaultUrlAvatar: string = 'public/default/kloud.svg';
  type = 'KLOUD';

  constructor(private readonly externalAccountRepo: ExternalAccountRepository) {
    super();
  }
  redis = new RedisAdapter(REDIS_PREFIXES.PhoneAddCode);
  userData = new RedisAdapter(REDIS_PREFIXES.UserData);

  syncUser(params: any, req: Request, res: Response): Promise<IAuthResponse> {
    throw new BadRequestException(Ei18nCodes.T3E0031);
  }
  async onActivate(): Promise<void> {
    return;
  }
  onBindAccount(userId: string, params: any) {
    throw new BadRequestException(Ei18nCodes.T3E0031);
  }

  @ProviderMethod(AuthByKloudDto)
  async onAuth(
    params: AuthByKloudDto,
    uid: string,
    provider: Provider,
    req: Request,
    res: Response,
  ): Promise<IAuthResponse> {
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

  isBindAccount(): boolean {
    return false;
  }

  @ProviderMethod(CreateKloudProviderDto)
  async onCreate(
    params: CreateKloudProviderDto,
    client_id: string,
    user_id: string,
  ): Promise<Prisma.ProviderCreateInput> {
    return this.prepareProviderCreateInput(client_id, params);
  }

  @ProviderMethod(UpdateKloudProviderDto)
  async onUpdate(
    params: UpdateKloudProviderDto,
    provider: Provider,
    client_id: string,
    user_id: string,
  ): Promise<Prisma.ProviderUpdateInput> {
    return this.prepareProviderUpdateInput(params);
  }

  /**
   * Checking for the presence of an identifier
   * @returns boolean - true if the phone is already in use
   */
  @ProviderMethod(VerificationStatusKloudDTO)
  async verificationStatus({
    phone_number,
    provider_id,
  }: VerificationStatusKloudDTO): Promise<{ isExist: boolean; uniqueRule: boolean }> {
    const kloudProvider = (await prisma.provider.findFirst({
      where: {
        id: parseInt(provider_id, 10),
      },
    })) as TKloudProvider;
    const externalAccount = await this.externalAccountRepo.findBySubIssuer(
      phone_number,
      kloudProvider.params.issuer,
      {
        user: {
          select: {
            nickname: true,
          },
        },
      },
    );

    return { isExist: !!externalAccount, uniqueRule: true };
  }

  /**
   * Sending a verification code
   * @param phoneNumber
   * @param clientId
   */
  public async callKloud(provider: TKloudProvider, phoneNumber: string) {
    const apiKey = Buffer.from(
      provider.params.external_client_id + ':' + provider.params.external_client_secret,
      'utf8',
    ).toString('base64');

    const url =
      provider.params.issuer +
      '/api/v1/call' +
      '?tel=' +
      encodeURIComponent(phoneNumber) +
      '&apiKey=' +
      apiKey;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'GET',
    });

    if (!response.ok) throw new BadRequestException(Ei18nCodes.T3E0056);

    if (response.ok) {
      const { success, code_type, code } = await response.json();
      await this.redis.upsert(phoneNumber, { code, counter: 0 }, 120);
      const code_length = code_type === 'number' ? code.length : null;

      return { success, code_type, ...(code_length && { code_length }) };
    }
  }

  public async checkCode(phone_number: string, code: string) {
    const resp = await this.redis.get<{ code: string; counter: number }>(phone_number);
    if (!resp) throw new BadRequestException(Ei18nCodes.T3E0098);

    if (resp.counter > 5) {
      await this.redis.destroy(phone_number);
      throw new BadRequestException(Ei18nCodes.T3E0054);
    }

    if (resp.code !== code) {
      await this.redis.upsert(phone_number, { code: resp.code, counter: resp.counter + 1 });
      throw new BadRequestException(Ei18nCodes.T3E0038);
    }
  }

  public async confirm(phone_number: string, code: string) {
    await this.checkCode(phone_number, code);
    await this.redis.destroy(phone_number);
  }

  @ProviderMethod(VerificationSendCodeKloudDTO)
  async verificationCode(params: VerificationSendCodeKloudDTO, req: Request, res: Response) {
    const { phone_number, client_id, provider_id } = params;
    const { provider } = await prisma.provider_relations.findFirst({
      where: {
        client_id,
        provider_id: parseInt(provider_id, 10),
        provider: {
          type: params.type,
        },
      },
      include: { provider: true },
    });
    if (!provider) throw new BadRequestException(Ei18nCodes.T3E0030);
    return this.callKloud(provider as TKloudProvider, phone_number);
  }
}
