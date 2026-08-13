import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma, Provider } from '@prisma/client';
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import { Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { prisma } from 'src/modules/prisma/prisma.client';
import { REDIS_PREFIXES, RedisAdapter } from 'src/modules/redis/redis.adapter';
import { legacyUserInclude, toLegacyUser } from 'src/modules/repository/user-compat';
import { UsersService } from 'src/modules/users/users.service';
import { DOMAIN } from '../../../../constants';
import { IAuthResponse } from '../../factory.service';
import { ProviderBase } from '../../provider.base';
import { BaseCreateProviderDto, BaseUpdateProviderDto } from '../../providers.dto';
import { ProviderMethod } from '../../providers.decorators';
import {
  CreateWebAuthnProviderDto,
  PROVIDER_TYPE_WEBAUTHN,
  UpdateWebAuthnProviderDto,
} from './webauthn.dto';
import { resolveWebAuthnOrigin } from './webauthn.utils';
import { Ei18nCodes } from 'src/enums';

type AuthenticatorAttachment = 'platform' | 'cross-platform';

type WebAuthnRegistrationRecord = {
  interactionId?: string;
  options: Awaited<ReturnType<typeof generateRegistrationOptions>>;
  providerId: string;
  userAgent: string;
  userId: string;
};

type WebAuthnAuthenticationRecord = {
  options: Awaited<ReturnType<typeof generateAuthenticationOptions>>;
  providerId: string;
};

@Injectable()
export class WebAuthnService extends ProviderBase {
  type = PROVIDER_TYPE_WEBAUTHN;
  defaultUrlAvatar: string = 'public/default/webauthn.svg';

  webauthnReg = new RedisAdapter(REDIS_PREFIXES.WebauthnRegistration);
  webauthnAuth = new RedisAdapter(REDIS_PREFIXES.WebauthnAuthorization);
  requiredAccountsInfoAdapter = new RedisAdapter(REDIS_PREFIXES.RequiredAccountsInfo);
  bindData = new RedisAdapter(REDIS_PREFIXES.BindData);
  mfa1 = new RedisAdapter(REDIS_PREFIXES.MFA1);
  mfa2 = new RedisAdapter(REDIS_PREFIXES.MFA2);
  userData = new RedisAdapter(REDIS_PREFIXES.UserData);
  twoFactorAuthentication = new RedisAdapter(REDIS_PREFIXES.TwoFactorAuthentication);

  get userService() {
    return this.moduleRef.get(UsersService, { strict: false });
  }

  get rpID() {
    return new URL(DOMAIN).hostname;
  }

  get expectedOrigin() {
    return resolveWebAuthnOrigin(DOMAIN);
  }

  private getExpectedAuthenticatorAttachment(params: unknown): AuthenticatorAttachment {
    const attachment =
      params && typeof params === 'object'
        ? (params as Record<string, unknown>).authenticatorAttachment
        : false;
    return attachment ? 'cross-platform' : 'platform';
  }

  private getAuthenticatorAttachmentFromDeviceInfo(
    restInfo: unknown,
  ): AuthenticatorAttachment | undefined {
    if (!restInfo || typeof restInfo !== 'object') {
      return undefined;
    }
    const attachment = (restInfo as Record<string, unknown>).authenticatorAttachment;
    if (attachment === 'platform' || attachment === 'cross-platform') {
      return attachment;
    }
    return undefined;
  }

  private prepareProviderParams(
    params: unknown,
    fallback: unknown = {},
  ): { authenticatorAttachment: boolean } {
    let source: Record<string, unknown> = {};
    if (params && typeof params === 'object') {
      source = params as Record<string, unknown>;
    } else if (fallback && typeof fallback === 'object') {
      source = fallback as Record<string, unknown>;
    }
    const attachmentValue = source.authenticatorAttachment;

    return {
      authenticatorAttachment: attachmentValue === true || attachmentValue === 'true',
    };
  }

  private async resolveRegistrationUserId(
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

    throw new ForbiddenException(Ei18nCodes.T3E0026);
  }

  private async resolveBindUserId(
    state?: string,
    requiredAccountsInfoUid?: string,
    interactionId?: string,
  ): Promise<string> {
    if (state) {
      const record = (await this.webauthnReg.find(state)) as WebAuthnRegistrationRecord | null;
      if (!record?.userId) {
        throw new BadRequestException(Ei18nCodes.T3E0034);
      }

      if (record.interactionId && record.interactionId !== interactionId) {
        throw new BadRequestException(Ei18nCodes.T3E0039);
      }

      return record.userId;
    }

    return this.resolveRegistrationUserId(null, requiredAccountsInfoUid, interactionId);
  }

  private async getAndDestroyRegistrationRecord(
    params: { interaction_id?: string; provider_id?: string; state?: string },
    userId: string,
  ): Promise<WebAuthnRegistrationRecord> {
    if (params.state) {
      const challengeRecord = (await this.webauthnReg.find(
        params.state,
      )) as WebAuthnRegistrationRecord | null;
      if (!challengeRecord) {
        throw new BadRequestException(Ei18nCodes.T3E0034);
      }

      if (challengeRecord.userId !== userId) {
        throw new BadRequestException(Ei18nCodes.T3E0003);
      }

      if (
        challengeRecord.interactionId &&
        challengeRecord.interactionId !== params.interaction_id
      ) {
        throw new BadRequestException(Ei18nCodes.T3E0039);
      }

      if (
        params.provider_id &&
        challengeRecord.providerId !== params.provider_id.toString()
      ) {
        throw new BadRequestException(Ei18nCodes.T3E0030);
      }

      await this.webauthnReg.destroy(params.state);
      await this.webauthnReg.destroy(`${challengeRecord.userId}:${challengeRecord.providerId}`);
      return challengeRecord;
    }

    const legacyRecord = (await this.webauthnReg.find(
      userId + ':' + params.provider_id,
    )) as WebAuthnRegistrationRecord | null;
    if (!legacyRecord) {
      throw new BadRequestException(Ei18nCodes.T3E0034);
    }
    await this.webauthnReg.destroy(userId + ':' + params.provider_id);
    return legacyRecord;
  }

  async onActivate(provider: Provider): Promise<void> {}

  @ProviderMethod(CreateWebAuthnProviderDto)
  async onCreate(
    params: BaseCreateProviderDto,
    client_id: string,
    user_id: string,
  ): Promise<Prisma.ProviderCreateInput> {
    params.params = this.prepareProviderParams(params.params);
    return this.prepareProviderCreateInput(client_id, params);
  }

  private normalizeProviderIds(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.map(String);
    }

    if (typeof value !== 'string' || !value) {
      return [];
    }

    try {
      const parsed = value.startsWith('j:') ? JSON.parse(value.slice(2)) : JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  private async assertInteractionProviderAllowed(
    providerId: string,
    interactionId: string,
    requiredProviderIds: unknown,
    userId: string,
  ): Promise<void> {
    const bindAccounts = (await this.bindData.find(interactionId)) || [];
    if (bindAccounts.some((account) => String(account?.provider_id) === providerId)) {
      return;
    }

    const secondFactorEnrollment = await this.twoFactorAuthentication.find(interactionId);
    if (
      secondFactorEnrollment?.user_id === userId &&
      Array.isArray(secondFactorEnrollment.provider_ids) &&
      secondFactorEnrollment.provider_ids.map(String).includes(providerId)
    ) {
      return;
    }

    const [mfa1, mfa2] = await Promise.all([
      this.mfa1.find(interactionId),
      this.mfa2.find(interactionId),
    ]);
    if (
      (mfa1 && !mfa2) ||
      !this.normalizeProviderIds(requiredProviderIds).includes(providerId)
    ) {
      throw new ForbiddenException(Ei18nCodes.T3E0026);
    }
  }

  @ProviderMethod(UpdateWebAuthnProviderDto)
  async onUpdate(
    params: BaseUpdateProviderDto,
    provider: Provider,
    client_id: string,
    user_id: string,
  ): Promise<Prisma.ProviderUpdateInput> {
    if (params.params) {
      params.params = this.prepareProviderParams(params.params, provider.params);
    }
    return this.prepareProviderUpdateInput(params);
  }

  syncUser(params: any, req: Request, res: Response): Promise<IAuthResponse> {
    throw new BadRequestException(Ei18nCodes.T3E0031);
  }

  async generateRegistrationOptions(
    userId: string | null | undefined,
    providerId: string,
    userAgent: string,
    requiredAccountsInfoUid?: string,
    interactionId?: string,
    requiredProviderIds?: unknown,
  ) {
    const resolvedUserId = await this.resolveRegistrationUserId(
      userId,
      requiredAccountsInfoUid,
      interactionId,
    );
    if (!userId && interactionId) {
      await this.assertInteractionProviderAllowed(
        providerId,
        interactionId,
        requiredProviderIds,
        resolvedUserId,
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: resolvedUserId,
      },
      include: legacyUserInclude,
    });
    const legacyUser = toLegacyUser(user);
    if (!legacyUser) {
      throw new BadRequestException(Ei18nCodes.T3E0003);
    }

    const provider = await prisma.provider.findFirst({
      where: {
        id: providerId,
        type: this.type,
      },
    });
    if (!provider) throw new BadRequestException(Ei18nCodes.T3E0030);
    const expectedAuthenticatorAttachment = this.getExpectedAuthenticatorAttachment(
      provider.params,
    );

    const userVerification =
      expectedAuthenticatorAttachment === 'cross-platform' ? 'discouraged' : 'preferred';

    const registeredDevices = await prisma.externalAccount.findMany({
      where: {
        user_id: resolvedUserId,
        type: this.type,
        issuer: DOMAIN,
      },
      select: {
        sub: true,
        rest_info: true,
      },
    });

    const excludeCredentials = registeredDevices
      .filter((device) => {
        if (!device.sub) {
          return false;
        }

        if (!device.rest_info || typeof device.rest_info !== 'object') {
          return true;
        }

        const restInfo = device.rest_info as Record<string, unknown>;
        const existingProviderId = restInfo.provider_id;
        if (existingProviderId !== undefined && String(existingProviderId) === provider.id) {
          return true;
        }

        const deviceAttachment = this.getAuthenticatorAttachmentFromDeviceInfo(device.rest_info);
        return !deviceAttachment || deviceAttachment === expectedAuthenticatorAttachment;
      })
      .map((device) => ({
        id: device.sub,
      }));

    const options = await generateRegistrationOptions({
      rpName: 'rpName',
      rpID: this.rpID,
      userID: new Uint8Array(Buffer.from(resolvedUserId)),
      userName:
        legacyUser.given_name && legacyUser.family_name
          ? `${legacyUser.given_name} ${legacyUser.family_name}`
          : legacyUser.nickname || legacyUser.login || legacyUser.email || `User ${legacyUser.id}`,
      attestationType: 'none',
      userDisplayName:
        legacyUser.given_name && legacyUser.family_name
          ? `${legacyUser.given_name} ${legacyUser.family_name}`
          : legacyUser.nickname || legacyUser.login || legacyUser.email || `User ${legacyUser.id}`,
      authenticatorSelection: {
        userVerification,
        authenticatorAttachment: expectedAuthenticatorAttachment,
      },
      excludeCredentials,
    });
    const challengeRecord: WebAuthnRegistrationRecord = {
      interactionId,
      options,
      providerId,
      userAgent,
      userId: resolvedUserId,
    };
    const state = uuid();

    await this.webauthnReg.upsert(`${resolvedUserId}:${providerId}`, challengeRecord, 5 * 60);
    await this.webauthnReg.upsert(state, challengeRecord, 5 * 60);

    return {
      ...options,
      state,
    };
  }

  async generateAuthenticationOptions(providerId: string) {
    const provider = await prisma.provider.findFirst({
      where: {
        id: providerId,
        type: this.type,
      },
    });
    if (!provider) throw new BadRequestException(Ei18nCodes.T3E0030);
    const expectedAuthenticatorAttachment = this.getExpectedAuthenticatorAttachment(
      provider.params,
    );

    const registeredDevices = await prisma.externalAccount.findMany({
      where: {
        type: this.type,
        issuer: DOMAIN,
      },
      select: {
        sub: true,
        rest_info: true,
      },
    });

    const allowCredentials = registeredDevices
      .filter((device) => {
        const restInfo =
          device.rest_info && typeof device.rest_info === 'object'
            ? (device.rest_info as Record<string, unknown>)
            : null;
        if (
          restInfo?.provider_id !== undefined &&
          String(restInfo.provider_id) !== provider.id
        ) {
          return false;
        }

        const deviceAttachment = this.getAuthenticatorAttachmentFromDeviceInfo(device.rest_info);
        return !deviceAttachment || deviceAttachment === expectedAuthenticatorAttachment;
      })
      .map((device) => ({
        id: device.sub,
        type: 'public-key' as const,
      }));

    const userVerification =
      expectedAuthenticatorAttachment === 'cross-platform' ? 'discouraged' : 'preferred';

    const options = await generateAuthenticationOptions({
      rpID: this.rpID,
      userVerification,
      allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
    });

    await this.webauthnAuth.upsert(
      options.challenge,
      {
        options,
        providerId: provider.id,
      } satisfies WebAuthnAuthenticationRecord,
      5 * 60,
    );
    return options;
  }

  // @ProviderMethod(AuthByWebAuthnDto)
  async onAuth(
    params: any,
    uid: string,
    provider: Provider,
    req: Request,
    res: Response,
  ): Promise<IAuthResponse> {
    if (params.passkey_not_available === 'true' || params.passkey_not_available === true) {
      return {
        user: undefined,
      };
    }

    if (params.registrationResponse) {
      const { required_accounts_info_uid } = req.cookies;
      const storedUserId = await this.resolveBindUserId(
        typeof params.state === 'string' ? params.state : undefined,
        required_accounts_info_uid,
        uid,
      );
      await this.assertInteractionProviderAllowed(
        provider.id,
        uid,
        req.cookies?._req_ids,
        storedUserId,
      );

      await this.userService.bindAccount(storedUserId, provider, {
        ...params,
        interaction_id: uid,
      });
      const bindAccounts = (await this.bindData.find(uid)) || [];
      const updatedBindAccounts = bindAccounts.filter(
        (account) =>
          !(
            account?.type === this.type &&
            String(account?.provider_id) === provider.id
          ),
      );
      if (updatedBindAccounts.length) {
        await this.bindData.upsert(uid, updatedBindAccounts, 3600);
      } else {
        await this.bindData.destroy(uid);
      }
      await this.twoFactorAuthentication.destroy(uid);
      res.clearCookie('required_accounts_info_uid');
      res.clearCookie('_req_ids');

      return {
        user: await prisma.user.findUnique({
          where: { id: storedUserId },
        }),
      };
    }

    const authenticationResponse =
      typeof params.authenticationResponse === 'string'
        ? JSON.parse(params.authenticationResponse)
        : params.authenticationResponse;

    const clientDataJSON = JSON.parse(
      Buffer.from(authenticationResponse.response.clientDataJSON, 'base64').toString(),
    );
    const challenge = clientDataJSON.challenge;

    const challengeRecord = (await this.webauthnAuth.find(
      challenge,
    )) as WebAuthnAuthenticationRecord | null;
    if (!challengeRecord) throw new BadRequestException(Ei18nCodes.T3E0034);
    await this.webauthnAuth.destroy(challenge);
    if (challengeRecord.providerId !== provider.id) {
      throw new BadRequestException(Ei18nCodes.T3E0030);
    }

    const { required_accounts_info_uid } = req.cookies;
    const { id: stored_user_id } =
      (await this.requiredAccountsInfoAdapter.get(required_accounts_info_uid)) || {};
    res.clearCookie('required_accounts_info_uid');

    const externalAccountRecord = await prisma.externalAccount.findFirst({
      where: {
        sub: authenticationResponse.id,
        issuer: DOMAIN,
        type: this.type,
      },
      include: {
        user: true,
      },
    });

    const user = externalAccountRecord?.user;

    if (externalAccountRecord && stored_user_id) {
      throw new BadRequestException(Ei18nCodes.T3E0006);
    }
    if (!externalAccountRecord) {
      return {
        user: undefined,
      };
    }

    const deviceInfo = externalAccountRecord.rest_info as any;
    if (deviceInfo?.provider_id !== undefined && String(deviceInfo.provider_id) !== provider.id) {
      throw new BadRequestException(Ei18nCodes.T3E0030);
    }

    const expectedAuthenticatorAttachment = this.getExpectedAuthenticatorAttachment(
      provider.params,
    );
    const credentialAuthenticatorAttachment =
      this.getAuthenticatorAttachmentFromDeviceInfo(deviceInfo) ||
      authenticationResponse.authenticatorAttachment;
    if (
      credentialAuthenticatorAttachment &&
      credentialAuthenticatorAttachment !== expectedAuthenticatorAttachment
    ) {
      throw new BadRequestException(Ei18nCodes.T3E0035);
    }

    const verification = await verifyAuthenticationResponse({
      response: authenticationResponse,
      expectedChallenge: challengeRecord.options.challenge,
      expectedOrigin: this.expectedOrigin,
      expectedRPID: this.rpID,
      credential: {
        id: externalAccountRecord.sub,
        publicKey: new Uint8Array(deviceInfo.publicKey),
        counter: deviceInfo.counter || 0,
      },
      requireUserVerification: expectedAuthenticatorAttachment === 'cross-platform' ? false : true,
    });

    if (!verification.verified) {
      throw new BadRequestException(Ei18nCodes.T3E0035);
    }

    await prisma.externalAccount.update({
      where: { id: externalAccountRecord.id },
      data: {
        rest_info: {
          ...deviceInfo,
          counter: verification.authenticationInfo.newCounter,
          lastUsed: new Date(),
          provider_id: provider.id,
          ...(credentialAuthenticatorAttachment
            ? { authenticatorAttachment: credentialAuthenticatorAttachment }
            : {}),
        },
      },
    });

    return {
      user,
    };
  }

  async onBindAccount(params: any, userId: string) {
    const challengeRecord = await this.getAndDestroyRegistrationRecord(params, userId);

    const provider = await prisma.provider.findFirst({
      where: {
        id: params.provider_id,
        type: this.type,
      },
    });
    if (!provider) throw new BadRequestException(Ei18nCodes.T3E0030);

    const registrationResponse =
      typeof params.registrationResponse === 'string'
        ? JSON.parse(params.registrationResponse)
        : params.registrationResponse;
    const expectedAuthenticatorAttachment = this.getExpectedAuthenticatorAttachment(
      provider.params,
    );
    const registrationAuthenticatorAttachment = registrationResponse?.authenticatorAttachment;

    if (
      registrationAuthenticatorAttachment &&
      registrationAuthenticatorAttachment !== expectedAuthenticatorAttachment
    ) {
      throw new BadRequestException(Ei18nCodes.T3E0033);
    }

    const requireUserVerification =
      expectedAuthenticatorAttachment === 'cross-platform' ? false : true;

    const verification = await verifyRegistrationResponse({
      response: registrationResponse,
      expectedChallenge: challengeRecord.options.challenge,
      expectedOrigin: this.expectedOrigin,
      expectedRPID: this.rpID,
      requireUserVerification,
    });

    if (verification.verified && verification.registrationInfo) {
      return {
        sub: verification.registrationInfo.credential.id,
        issuer: DOMAIN,
        type: this.type,
        label: challengeRecord.userAgent,
        rest_info: {
          publicKey: Array.from(verification.registrationInfo.credential.publicKey),
          counter: verification.registrationInfo.credential.counter,
          createdAt: new Date(),
          aaguid: verification.registrationInfo.aaguid,
          provider_id: provider.id,
          authenticatorAttachment:
            registrationAuthenticatorAttachment || expectedAuthenticatorAttachment,
        },
      };
    }

    throw new BadRequestException(Ei18nCodes.T3E0033);
  }
}
