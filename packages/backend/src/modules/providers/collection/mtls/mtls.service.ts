import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, Provider } from '@prisma/client';
import { Request, Response } from 'express';
import { DOMAIN } from 'src/constants';
import { IAuthResponse } from 'src/modules/providers/factory.service';
import { ProviderBase } from 'src/modules/providers/provider.base';
import { ProviderMethod } from 'src/modules/providers/providers.decorators';
import { REDIS_PREFIXES, RedisAdapter } from 'src/modules/redis/redis.adapter';
import { UsersService } from 'src/modules/users/users.service';
import { v4 as uuid } from 'uuid';
import { MtlsInfo } from './mtls.decorator';
import {
  AuthByMTLSDto,
  CreateMTLSProviderDto,
  PROVIDER_TYPE_MTLS,
  UpdateMTLSProviderDto,
} from './mtls.dto';
import { prisma } from 'src/modules/prisma/prisma.client';
import { Ei18nCodes } from 'src/enums';
import { getCnFromString } from 'src/helpers';

@Injectable()
export class MtlsService extends ProviderBase {
  type = PROVIDER_TYPE_MTLS;
  defaultUrlAvatar: string = 'public/default/mtls.svg';

  mtlsAuth = new RedisAdapter(REDIS_PREFIXES.MtlsAuthorization);
  mtlsBind = new RedisAdapter(REDIS_PREFIXES.MtlsRegistration);
  requiredAccountsInfoAdapter = new RedisAdapter(REDIS_PREFIXES.RequiredAccountsInfo);
  bindData = new RedisAdapter(REDIS_PREFIXES.BindData);
  mfa1 = new RedisAdapter(REDIS_PREFIXES.MFA1);
  userData = new RedisAdapter(REDIS_PREFIXES.UserData);

  get userService() {
    return this.moduleRef.get(UsersService, { strict: false });
  }

  syncUser(params: any, req: Request, res: Response): Promise<IAuthResponse> {
    throw new BadRequestException(Ei18nCodes.T3E0031);
  }

  async saveAuthState(state: string, authData: any) {
    await this.mtlsAuth.upsert(state, authData, 5 * 60); // TTL 5 minutes
  }

  async saveBindState(state: string, bindData: any) {
    await this.mtlsBind.upsert(state, bindData, 5 * 60); // TTL 5 minutes
  }

  async getAndDeleteAuthState(state: string) {
    const data = await this.mtlsAuth.find(state);
    if (!data) throw new BadRequestException(Ei18nCodes.T3E0039);
    await this.mtlsAuth.destroy(state);
    return data;
  }

  async getAndDeleteBindState(state: string) {
    const data = await this.mtlsBind.find(state);
    if (!data) throw new BadRequestException(Ei18nCodes.T3E0039);
    await this.mtlsBind.destroy(state);
    return data;
  }

  private async resolveBindUserId(
    userId?: string | null,
    requiredAccountsInfoUid?: string,
    interactionId?: string,
  ): Promise<string> {
    if (userId) {
      return userId;
    }

    if (requiredAccountsInfoUid) {
      const { id } = (await this.requiredAccountsInfoAdapter.get(requiredAccountsInfoUid)) || {};
      if (id) {
        return `${id}`;
      }
    }

    if (interactionId) {
      const mfa1 = await this.mfa1.find(interactionId);
      if (mfa1?.user_id) {
        return `${mfa1.user_id}`;
      }

      const userData = await this.userData.find(interactionId);
      if (userData?.id) {
        return `${userData.id}`;
      }
    }

    throw new BadRequestException(Ei18nCodes.T3E0003);
  }

  private async clearPendingBindAccount(interactionId: string, providerId: string) {
    const bindAccounts = (await this.bindData.find(interactionId)) || [];
    const updatedBindAccounts = bindAccounts.filter(
      (account) => !(account?.type === this.type && String(account?.provider_id) === providerId),
    );

    if (updatedBindAccounts.length) {
      await this.bindData.upsert(interactionId, updatedBindAccounts, 3600);
      return;
    }

    await this.bindData.destroy(interactionId);
  }

  async initiateBind(userId: string, providerId: string, mtlsInfo: MtlsInfo) {
    if (!mtlsInfo || !mtlsInfo.fingerprint) {
      throw new BadRequestException(
        'Certificate information is missing or incomplete. Please provide valid certificate details.',
      );
    }

    const state = uuid();
    await this.saveBindState(state, {
      userId,
      providerId,
      mtlsInfo,
      timestamp: Date.now(),
    });

    return state;
  }

  async initiateInteractionBind(
    providerId: string,
    mtlsInfo: MtlsInfo,
    interactionId: string,
    requiredAccountsInfoUid?: string,
  ) {
    const userId = await this.resolveBindUserId(null, requiredAccountsInfoUid, interactionId);
    return this.initiateBind(userId, providerId, mtlsInfo);
  }

  async initiateAuth(providerId: string, mtlsInfo: MtlsInfo) {
    if (!mtlsInfo || !mtlsInfo.fingerprint) {
      throw new BadRequestException(Ei18nCodes.T3E0052);
    }

    if (mtlsInfo.hasOwnProperty('valid') && !(mtlsInfo as any).valid) {
      throw new BadRequestException(Ei18nCodes.T3E0053);
    }

    const state = uuid();
    await this.saveAuthState(state, {
      providerId,
      mtlsInfo,
      fingerprint: mtlsInfo.fingerprint,
      timestamp: Date.now(),
    });

    return state;
  }

  async onActivate(provider: Provider): Promise<void> {}

  @ProviderMethod(CreateMTLSProviderDto)
  async onCreate(
    params: CreateMTLSProviderDto,
    client_id: string,
    user_id: string,
  ): Promise<Prisma.ProviderCreateInput> {
    return this.prepareProviderCreateInput(client_id, params);
  }

  @ProviderMethod(UpdateMTLSProviderDto)
  async onUpdate(
    params: UpdateMTLSProviderDto,
    provider: Provider,
    client_id: string,
    user_id: string,
  ): Promise<Prisma.ProviderUpdateInput> {
    return this.prepareProviderUpdateInput(params);
  }

  async onBindAccount(params: any, userId: string) {
    if (!params.state) {
      throw new BadRequestException(Ei18nCodes.T3E0039);
    }
    const bindData = await this.getAndDeleteBindState(params.state);
    if (bindData.userId !== userId) {
      throw new BadRequestException(Ei18nCodes.T3E0003);
    }

    const mtlsInfo = bindData.mtlsInfo;

    let label = mtlsInfo.cn;
    if (label && mtlsInfo.issuer) {
      label += ` (${getCnFromString(mtlsInfo.issuer)})`;
    }

    return {
      sub: mtlsInfo.fingerprint,
      issuer: DOMAIN,
      type: this.type,
      label: label || mtlsInfo.dn || mtlsInfo.serial || mtlsInfo.fingerprint,
      rest_info: {
        ...mtlsInfo,
        createdAt: new Date(),
        provider_id: bindData.providerId || undefined,
      },
    };
  }

  @ProviderMethod(AuthByMTLSDto)
  async onAuth(
    params: AuthByMTLSDto,
    uid: string,
    provider: Provider,
    req: Request,
    res: Response,
  ): Promise<IAuthResponse> {
    if (!params.state) {
      throw new BadRequestException(Ei18nCodes.T3E0039);
    }

    const bindState = await this.mtlsBind.find(params.state);
    if (bindState) {
      if (bindState.providerId !== provider.id.toString()) {
        throw new BadRequestException(Ei18nCodes.T3E0030);
      }

      const { required_accounts_info_uid } = req.cookies;
      const storedUserId = await this.resolveBindUserId(null, required_accounts_info_uid, uid);

      await this.userService.bindAccount(storedUserId, provider, params);
      await this.clearPendingBindAccount(uid, provider.id);
      res.clearCookie('required_accounts_info_uid');

      return {
        user: await prisma.user.findUnique({
          where: { id: storedUserId },
        }),
      };
    }

    const authData = await this.getAndDeleteAuthState(params.state);
    if (authData.providerId !== provider.id.toString()) {
      throw new BadRequestException(Ei18nCodes.T3E0030);
    }

    const externalAccount = await prisma.externalAccount.findFirst({
      where: {
        sub: {
          equals: authData.fingerprint,
          mode: 'insensitive',
        },
        type: this.type,
        issuer: DOMAIN,
      },
      include: {
        user: true,
      },
    });

    if (!externalAccount) {
      throw new BadRequestException(
        'Certificate not found in the system. Please bind the certificate to an account first.',
      );
    }

    if (
      externalAccount.rest_info &&
      typeof externalAccount.rest_info === 'object' &&
      !Array.isArray(externalAccount.rest_info) &&
      (externalAccount.rest_info as Record<string, unknown>).authentication_enabled === false
    ) {
      throw new BadRequestException('Authentication with this certificate is disabled.');
    }

    return {
      user: externalAccount.user,
    };
  }

  async findUserByThumbprint(thumbprint: string) {
    const externalAccount = await prisma.externalAccount.findFirst({
      where: {
        sub: {
          equals: thumbprint,
          mode: 'insensitive',
        },
        type: this.type,
        issuer: DOMAIN,
      },
      include: { user: true },
    });

    if (
      externalAccount?.rest_info &&
      typeof externalAccount.rest_info === 'object' &&
      !Array.isArray(externalAccount.rest_info) &&
      (externalAccount.rest_info as Record<string, unknown>).authentication_enabled === false
    ) {
      return null;
    }

    return externalAccount?.user || null;
  }
}
