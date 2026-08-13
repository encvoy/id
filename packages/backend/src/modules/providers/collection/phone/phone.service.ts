import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, Provider } from '@prisma/client';
import { Request, Response } from 'express';
import { CLIENT_ID } from 'src/constants';
import { isUrl } from 'src/helpers';
import { USER_ID_KEY } from 'src/decorators/userId.decorator';
import { Ei18nCodes, EProviderTypes } from 'src/enums';
import { prisma } from 'src/modules/prisma';
import { legacyUserInclude, toLegacyUser } from 'src/modules/repository/user-compat';
import { legacyUserPhoneExternalAccountTypes } from 'src/modules/repository';
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
  uid = new RedisAdapter(REDIS_PREFIXES.uid);

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
    const user = await prisma.user.findFirst({
      where: {
        externalAccounts: {
          some: {
            sub: params.phone_number,
            type: {
              in: [...legacyUserPhoneExternalAccountTypes],
            },
          },
        },
      },
      include: legacyUserInclude,
    });
    if (!user) {
      data = data || {};
      data.phone_number = params.phone_number;
      await this.userData.upsert(uid, data, 3600);
    }

    return { user: toLegacyUser(user) as any };
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

    const existingAccount = await prisma.externalAccount.findFirst({
      where: {
        sub: params.phone_number,
        type: {
          in: [EProviderTypes.PHONE, EProviderTypes.KLOUD],
        },
      },
    });
    return { isExist: !!existingAccount, uniqueRule: true };
  }

  @ProviderMethod(VerificationSendCodePhoneDTO)
  async verificationCode(
    params: VerificationSendCodePhoneDTO,
    req: Request,
    res: Response,
  ): Promise<any> {
    await this.ensurePhoneIsNotAlreadyAttachedToCurrentUser(req, params.phone_number);

    const phoneProvider = await this.resolvePhoneProvider(params, req);
    if (!phoneProvider) {
      throw new BadRequestException(Ei18nCodes.T3E0030);
    }
    if (!this.hasValidPhoneProviderConfig(phoneProvider)) {
      throw new BadRequestException(Ei18nCodes.T3E0097);
    }

    return this.kloudService.callKloud(phoneProvider, params.phone_number);
  }

  async confirm(phoneNumber: string, code: string) {
    await this.kloudService.confirm(phoneNumber, code);
  }

  async confirmWithContext(phoneNumber: string, code: string) {
    return this.kloudService.confirmWithContext(phoneNumber, code);
  }

  async checkCode(phoneNumber: string, code: string) {
    await this.kloudService.checkCode(phoneNumber, code);
  }

  private async resolvePhoneProvider(
    params: VerificationSendCodePhoneDTO,
    req: Request,
  ): Promise<TPhoneProvider | null> {
    const providerId =
      params.provider_id ||
      (typeof req.query?.provider_id === 'string' ? req.query.provider_id : undefined);
    const clientIds = await this.resolvePhoneClientIds(params, req);

    for (const clientId of clientIds) {
      const scopedProvider = await this.findPhoneProviderForClient(clientId, providerId);
      if (scopedProvider) {
        return scopedProvider;
      }
    }

    if (providerId) {
      const provider = await prisma.provider.findFirst({
        where: {
          id: providerId,
          type: EProviderTypes.PHONE,
        },
      });

      if (provider) {
        return provider as TPhoneProvider;
      }
    }

    return null;
  }

  private async ensurePhoneIsNotAlreadyAttachedToCurrentUser(
    req: Request,
    phoneNumber: string,
  ): Promise<void> {
    const userId = typeof req[USER_ID_KEY] === 'string' ? req[USER_ID_KEY] : null;
    if (!userId) {
      return;
    }

    const existingAccount = await prisma.externalAccount.findFirst({
      where: {
        user_id: userId,
        sub: phoneNumber,
        type: {
          in: [EProviderTypes.PHONE, EProviderTypes.KLOUD],
        },
      },
      select: {
        id: true,
      },
    });

    if (existingAccount) {
      throw new BadRequestException(Ei18nCodes.T3E0079);
    }
  }

  private async resolvePhoneClientIds(
    params: VerificationSendCodePhoneDTO,
    req: Request,
  ): Promise<string[]> {
    const clientId =
      params.client_id || (typeof req.query?.client_id === 'string' ? req.query.client_id : undefined);
    if (clientId) {
      return this.buildClientResolutionChain(clientId);
    }

    const uid = params.uid || (typeof req.query?.uid === 'string' ? req.query.uid : undefined);
    if (uid) {
      const session = await this.uid.get<{ params?: { client_id?: string } }>(uid);
      const sessionClientId = session?.params?.client_id;
      if (sessionClientId) {
        return this.buildClientResolutionChain(sessionClientId);
      }
    }

    const userId = typeof req[USER_ID_KEY] === 'string' ? req[USER_ID_KEY] : null;
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { org_id: true },
      });

      return this.normalizeClientIds([user?.org_id || CLIENT_ID, CLIENT_ID]);
    }

    return [CLIENT_ID];
  }

  private async buildClientResolutionChain(clientId: string): Promise<string[]> {
    const client = await prisma.client.findUnique({
      where: { client_id: clientId },
      select: { parent_id: true },
    });

    return this.normalizeClientIds([
      clientId,
      client?.parent_id || null,
      clientId === CLIENT_ID ? null : CLIENT_ID,
    ]);
  }

  private normalizeClientIds(clientIds: Array<string | null | undefined>): string[] {
    return [...new Set(clientIds.filter((value): value is string => Boolean(value)))];
  }

  private async findPhoneProviderForClient(
    clientId: string,
    providerId?: string,
  ): Promise<TPhoneProvider | null> {
    const directProviders = await prisma.provider.findMany({
      where: {
        type: EProviderTypes.PHONE,
        client_id: clientId,
        ...(providerId ? { id: providerId } : {}),
      },
      orderBy: {
        updated_at: 'desc',
      },
    });

    const directProvider = this.selectPhoneProvider(directProviders as TPhoneProvider[], !providerId);
    if (directProvider) {
      return directProvider;
    }

    const relations = await prisma.provider_relations.findMany({
      where: {
        client_id: clientId,
        ...(providerId ? { provider_id: providerId } : {}),
        provider: {
          type: EProviderTypes.PHONE,
        },
      },
      include: {
        provider: true,
      },
      orderBy: {
        updated_at: 'desc',
      },
    });

    const relationProvider = this.selectPhoneProvider(
      relations.map((relation) => relation.provider as TPhoneProvider),
      !providerId,
    );
    if (relationProvider) {
      return relationProvider;
    }

    const publicProviders = await prisma.provider.findMany({
      where: {
        type: EProviderTypes.PHONE,
        is_public: true,
        client_id: clientId,
        ...(providerId ? { id: providerId } : {}),
      },
      orderBy: {
        updated_at: 'desc',
      },
    });

    return this.selectPhoneProvider(publicProviders as TPhoneProvider[], !providerId);
  }

  private selectPhoneProvider(
    providers: TPhoneProvider[],
    preferValidConfig: boolean,
  ): TPhoneProvider | null {
    if (!providers.length) {
      return null;
    }

    if (!preferValidConfig) {
      return providers[0];
    }

    return providers.find((provider) => this.hasValidPhoneProviderConfig(provider)) || providers[0];
  }

  private hasValidPhoneProviderConfig(provider: TPhoneProvider): boolean {
    const params = provider?.params;
    if (!params || typeof params !== 'object') {
      return false;
    }

    const issuer = typeof params.issuer === 'string' ? params.issuer.trim() : '';
    const externalClientId =
      typeof params.external_client_id === 'string' ? params.external_client_id.trim() : '';
    const externalClientSecret =
      typeof params.external_client_secret === 'string'
        ? params.external_client_secret.trim()
        : '';

    return Boolean(issuer && isUrl(issuer) && externalClientId && externalClientSecret);
  }
}
