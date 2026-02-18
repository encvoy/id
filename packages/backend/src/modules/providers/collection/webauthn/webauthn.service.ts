import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, Provider } from '@prisma/client';
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import { Request, Response } from 'express';
import { app } from 'src/main';
import { prisma } from 'src/modules/prisma/prisma.client';
import { REDIS_PREFIXES, RedisAdapter } from 'src/modules/redis/redis.adapter';
import { UsersService } from 'src/modules/users/users.service';
import { DOMAIN } from '../../../../constants';
import { IAuthResponse } from '../../factory.service';
import { ProviderBase } from '../../provider.base';
import { BaseCreateProviderDto, BaseUpdateProviderDto } from '../../providers.dto';
import { ProviderMethod } from '../../providers.decorators';
import { CreateWebAuthnProviderDto, PROVIDER_TYPE_WEBAUTHN } from './webauthn.dto';
import { Ei18nCodes } from 'src/enums';

@Injectable()
export class WebAuthnService extends ProviderBase {
  type = PROVIDER_TYPE_WEBAUTHN;
  defaultUrlAvatar: string = 'public/default/webauthn.svg';

  webauthnReg = new RedisAdapter(REDIS_PREFIXES.WebauthnRegistration);
  webauthnAuth = new RedisAdapter(REDIS_PREFIXES.WebauthnAuthorization);
  requiredAccountsInfoAdapter = new RedisAdapter(REDIS_PREFIXES.RequiredAccountsInfo);

  get userService() {
    return app.get(UsersService, { strict: false });
  }

  get rpID() {
    return new URL(DOMAIN).hostname;
  }

  async onActivate(provider: Provider): Promise<void> {}

  @ProviderMethod(CreateWebAuthnProviderDto)
  async onCreate(
    params: BaseCreateProviderDto,
    client_id: string,
    user_id: string,
  ): Promise<Prisma.ProviderCreateInput> {
    return this.prepareProviderCreateInput(client_id, params);
  }

  async onUpdate(
    params: BaseUpdateProviderDto,
    provider: Provider,
    client_id: string,
    user_id: string,
  ): Promise<Prisma.ProviderUpdateInput> {
    return this.prepareProviderUpdateInput(params);
  }

  syncUser(params: any, req: Request, res: Response): Promise<IAuthResponse> {
    throw new BadRequestException(Ei18nCodes.T3E0031);
  }

  async generateRegistrationOptions(userId: string, providerId: string, userAgent: string) {
    const user = await prisma.user.findUnique({
      where: {
        id: parseInt(userId),
      },
    });

    const provider = await prisma.provider.findFirst({
      where: {
        id: parseInt(providerId),
        type: this.type,
      },
    });
    if (!provider) throw new BadRequestException(Ei18nCodes.T3E0030);

    const options = await generateRegistrationOptions({
      rpName: 'rpName',
      rpID: this.rpID,
      userID: new Uint8Array(Buffer.from(userId)),
      userName:
        user.given_name && user.family_name
          ? `${user.given_name} ${user.family_name}`
          : user.nickname,
      attestationType: 'none',
      userDisplayName:
        user.given_name && user.family_name
          ? `${user.given_name} ${user.family_name}`
          : user.nickname,
    });
    await this.webauthnReg.upsert(`${userId}:${providerId}`, { options, userAgent }, 5 * 60);
    return options;
  }

  async generateAuthenticationOptions(providerId: string) {
    const provider = await prisma.provider.findFirst({
      where: {
        id: parseInt(providerId),
        type: this.type,
      },
    });
    if (!provider) throw new BadRequestException(Ei18nCodes.T3E0030);

    const registeredDevices = await prisma.externalAccount.findMany({
      where: {
        type: this.type,
        issuer: DOMAIN,
      },
      select: {
        sub: true,
      },
    });

    const allowCredentials = registeredDevices.map((device) => ({
      id: device.sub,
      type: 'public-key' as const,
    }));

    const options = await generateAuthenticationOptions({
      rpID: this.rpID,
      userVerification: 'preferred',
      allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
    });

    await this.webauthnAuth.upsert(options.challenge, options, 5 * 60);
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
    const authenticationResponse =
      typeof params.authenticationResponse === 'string'
        ? JSON.parse(params.authenticationResponse)
        : params.authenticationResponse;

    const clientDataJSON = JSON.parse(
      Buffer.from(authenticationResponse.response.clientDataJSON, 'base64').toString(),
    );
    const challenge = clientDataJSON.challenge;

    const challengeRecord = await this.webauthnAuth.find(challenge);
    if (!challengeRecord) throw new BadRequestException(Ei18nCodes.T3E0034);
    await this.webauthnAuth.destroy(challenge);

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
      const externalAccountInfo = JSON.stringify({
        provider_name: provider.name,
        type: this.type,
        issuer: DOMAIN,
        sub: authenticationResponse.id,
        provider_id: provider.id,
        label: `WebAuthn device`,
      });

      return {
        user,
        renderWidgetParams: {
          initialRoute: 'bind',
          externalAccountInfo,
        },
      };
    }

    const deviceInfo = externalAccountRecord.rest_info as any;
    const verification = await verifyAuthenticationResponse({
      response: authenticationResponse,
      expectedChallenge: challengeRecord.challenge,
      expectedOrigin: DOMAIN,
      expectedRPID: this.rpID,
      credential: {
        id: externalAccountRecord.sub,
        publicKey: new Uint8Array(deviceInfo.publicKey),
        counter: deviceInfo.counter || 0,
      },
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
        },
      },
    });

    return {
      user,
    };
  }

  async onBindAccount(params: any, userId: string) {
    const challengeRecord = await this.webauthnReg.find(userId + ':' + params.provider_id);
    if (!challengeRecord) throw new BadRequestException(Ei18nCodes.T3E0034);
    await this.webauthnReg.destroy(userId + ':' + params.provider_id);

    const verification = await verifyRegistrationResponse({
      response: params.registrationResponse,
      expectedChallenge: challengeRecord.options.challenge,
      expectedOrigin: DOMAIN,
      expectedRPID: this.rpID,
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
        },
      };
    }

    throw new BadRequestException(Ei18nCodes.T3E0033);
  }
}
