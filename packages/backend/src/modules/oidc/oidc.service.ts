import { Injectable } from '@nestjs/common/decorators';
import { Request, Response } from 'express';
import fetch from 'node-fetch';
import { getInternalRequestHeaders } from 'src/internal-request';
import { CLIENT_ID, DOMAIN } from '../../constants';
import { REDIS_PREFIXES, RedisAdapter } from '../redis/redis.adapter';
import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Ei18nCodes } from 'src/enums';
import { TokenKind, normalizeTokenKind } from 'src/request-auth';
import { redisClient } from '../redis/redis.client';

@Injectable()
export class OidcService {
  private redisAccessToken = new RedisAdapter('oidc:AccessToken');
  private redisGrant = new RedisAdapter('oidc:Grant');
  private redisInteraction = new RedisAdapter('oidc:Interaction');
  private redisSession = new RedisAdapter('oidc:Session');
  private redisUserData = new RedisAdapter(REDIS_PREFIXES.UserData);
  private oidcRedis = redisClient('oidc');

  private inactiveTokenIntrospection() {
    return {
      active: false,
      client_id: '',
      user_id: '',
      tokenPermissions: [],
      tokenKind: 'session' as TokenKind,
    };
  }

  private isExpired(payload: any): boolean {
    return typeof payload?.exp === 'number' && payload.exp <= Math.floor(Date.now() / 1000);
  }

  private normalizePermissions(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.filter((permission): permission is string => typeof permission === 'string');
    }

    return typeof value === 'string' && value ? [value] : [];
  }

  async updateOidcInteraction(uid: string, update: Record<string, any>) {
    const interactionId = await this.redisInteraction.find(uid);
    if (!interactionId) throw new BadRequestException('Interaction not found by uid');
    let data = await this.redisInteraction.find(interactionId.uid || interactionId.id || uid);
    if (!data) throw new BadRequestException('Interaction not found');
    data.result = { ...data.result, ...update };
    const id = interactionId.uid || interactionId.id || uid;
    const expiresIn = data.exp ? Math.max(0, data.exp - Math.floor(Date.now() / 1000)) : 3600;
    await this.redisInteraction.upsert(id, data, expiresIn);
  }

  public async tokenIntrospection(token: string): Promise<{
    active: boolean;
    client_id: string;
    user_id: string;
    tokenPermissions: string[];
    tokenKind: TokenKind;
  }> {
    try {
      const inactive = this.inactiveTokenIntrospection();
      const accessToken = await this.redisAccessToken.find(token);

      if (!accessToken || this.isExpired(accessToken)) {
        return inactive;
      }

      if (accessToken.clientId !== CLIENT_ID) {
        return inactive;
      }

      if (accessToken.grantId) {
        const grant = await this.redisGrant.find(accessToken.grantId);
        if (
          !grant ||
          this.isExpired(grant) ||
          grant.clientId !== accessToken.clientId ||
          grant.accountId !== accessToken.accountId
        ) {
          return inactive;
        }
      }

      const extra = accessToken.extra || {};
      return {
        active: true,
        client_id: accessToken.clientId || '',
        user_id: accessToken.accountId || '',
        tokenPermissions: this.normalizePermissions(extra.permissions),
        tokenKind: normalizeTokenKind(extra.token_kind),
      };
    } catch (e) {
      throw new InternalServerErrorException('Invalid token', { cause: e });
    }
  }

  public async tokenRevocation(token: string): Promise<void> {
    try {
      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
      };
      const body = new URLSearchParams({
        token,
        client_id: CLIENT_ID,
        token_type_hint: 'access_token',
      });

      const response = await fetch(DOMAIN + '/oidc/token/revocation', {
        method: 'POST',
        headers,
        body,
      });

      if (!response.ok) {
        throw new BadRequestException(`Token revocation failed: ${response.status}`);
      }

      return;
    } catch (e) {
      throw new InternalServerErrorException(Ei18nCodes.T3E0078, { cause: e });
    }
  }

  public async revokeAccessTokenGrant(grantId: string): Promise<void> {
    try {
      const grantKey = `oidc:${REDIS_PREFIXES.grant}:${grantId}`;
      const tokenKeys = await this.oidcRedis.lrange(grantKey, 0, -1);
      const multi = this.oidcRedis.multi();

      tokenKeys.forEach((tokenKey) => multi.del(tokenKey));
      multi.del(grantKey);

      await multi.exec();
    } catch (e) {
      throw new InternalServerErrorException(Ei18nCodes.T3E0078, { cause: e });
    }
  }

  public async destroyAccessToken(tokenId: string): Promise<void> {
    try {
      await this.oidcRedis.del(`oidc:${REDIS_PREFIXES.AccessToken}:${tokenId}`);
    } catch (e) {
      throw new InternalServerErrorException(Ei18nCodes.T3E0078, { cause: e });
    }
  }

  public async interactionDetails(req: Request, res: Response): Promise<any> {
    try {
      const interactionId = req.cookies?._interaction || req.cookies?.['_interaction.legacy'];
      if (!interactionId) {
        throw new BadRequestException('Interaction session id cookie not found');
      }

      const interaction = await this.redisInteraction.find(interactionId);
      if (!interaction) {
        throw new BadRequestException('Interaction session not found');
      }

      if (interaction.session?.uid) {
        const sessionId = await this.oidcRedis.get(
          `oidc:${REDIS_PREFIXES.uid}:${interaction.session.uid}`,
        );
        const session = sessionId ? await this.redisSession.find(sessionId) : undefined;
        if (!session) {
          throw new BadRequestException('Session not found');
        }
        if (interaction.session.accountId !== session.accountId) {
          throw new BadRequestException('Session principal changed');
        }
      }

      return interaction;
    } catch (e) {
      throw new InternalServerErrorException(Ei18nCodes.T3E0078, { cause: e });
    }
  }

  public async interactionFinished(
    req: Request,
    res: Response,
    result: any,
    uid: string,
    mergeWithLastSubmission?: boolean,
  ): Promise<void> {
    try {
      let newResult = result;
      if (mergeWithLastSubmission) {
        let data = await this.redisInteraction.find(uid);
        if (data && data.result) {
          newResult = { ...data.result, ...result };
        }
      }
      await this.redisUserData.destroy(uid);
      await this.updateOidcInteraction(uid, newResult);
    } catch (e) {
      throw new InternalServerErrorException(Ei18nCodes.T3E0078, { cause: e });
    }

    return res.redirect(`${DOMAIN.replace(/\/+$/, '')}/oidc/auth/${uid}`);
  }

  public async getGrant(grantId: string): Promise<any> {
    try {
      const response = await fetch(DOMAIN + `/oidc/api/grants/${grantId}`, {
        method: 'GET',
        headers: await getInternalRequestHeaders(),
      });

      if (!response.ok) {
        throw new BadRequestException(`Get grant failed: ${response.status}`);
      }

      return await response.json();
    } catch (e) {
      throw new InternalServerErrorException(Ei18nCodes.T3E0078, { cause: e });
    }
  }

  public async createGrant(data: { accountId: string; clientId: string }): Promise<any> {
    try {
      const response = await fetch(DOMAIN + '/oidc/api/grants', {
        method: 'POST',
        headers: await getInternalRequestHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new BadRequestException(`Create grant failed: ${response.status}`);
      }

      return await response.json();
    } catch (e) {
      throw new InternalServerErrorException(Ei18nCodes.T3E0078, { cause: e });
    }
  }

  public async updateGrantScopes(grantId: string, scopes: string): Promise<any> {
    try {
      const response = await fetch(DOMAIN + `/oidc/api/grants/${grantId}/scopes`, {
        method: 'PATCH',
        headers: await getInternalRequestHeaders(),
        body: JSON.stringify({ scopes }),
      });

      if (!response.ok) {
        throw new BadRequestException(`Update grant scopes failed: ${response.status}`);
      }

      return await response.json();
    } catch (e) {
      throw new InternalServerErrorException(Ei18nCodes.T3E0078, { cause: e });
    }
  }

  public async issuePersonalAccessToken(data: {
    accountId: string;
    clientId: string;
    permissions: string[];
    expiresIn?: number;
    neverExpires?: boolean;
    name?: string;
  }): Promise<{
    access_token: string;
    token_type: string;
    expires_in: number | null;
    exp?: number;
    jti: string;
    grant_id?: string;
    permissions: string[];
  }> {
    try {
      const response = await fetch(DOMAIN + '/oidc/api/tokens', {
        method: 'POST',
        headers: await getInternalRequestHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const responseData = await response.json().catch(() => null);
        const message =
          (responseData &&
            typeof responseData === 'object' &&
            'error' in responseData &&
            typeof responseData.error === 'string' &&
            responseData.error) ||
          `Issue token failed: ${response.status}`;

        if (response.status === 403) {
          throw new ForbiddenException(message);
        }

        throw new BadRequestException(message);
      }

      return await response.json();
    } catch (e) {
      if (e instanceof HttpException) {
        throw e;
      }
      throw new InternalServerErrorException(Ei18nCodes.T3E0078, { cause: e });
    }
  }
}
