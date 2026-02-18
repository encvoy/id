import { Injectable } from '@nestjs/common/decorators';
import { Request, Response } from 'express';
import fetch from 'node-fetch';
import { CLIENT_ID, DOMAIN } from '../../constants';
import { REDIS_PREFIXES, RedisAdapter } from '../redis/redis.adapter';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Ei18nCodes } from 'src/enums';

@Injectable()
export class OidcService {
  private redisInteraction = new RedisAdapter('oidc:Interaction');
  private redisUserData = new RedisAdapter(REDIS_PREFIXES.UserData);

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

  public async tokenIntrospection(
    token: string,
  ): Promise<{ active: boolean; client_id: string; user_id: string; tokenScopes: string[] }> {
    try {
      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
      };
      const body = new URLSearchParams({
        token,
        client_id: CLIENT_ID,
        token_type_hint: 'access_token',
      });
      const response = await fetch(DOMAIN + '/oidc/token/introspection', {
        method: 'POST',
        headers,
        body,
      });

      if (!response.ok) {
        throw new BadRequestException(`Token introspection failed: ${response.status}`);
      }

      const responseData = await response.json();
      const { active, client_id, sub: user_id, scope: tokenScopes } = responseData;
      return {
        active: !!active,
        client_id: client_id || '',
        user_id: user_id || '',
        tokenScopes: Array.isArray(tokenScopes)
          ? tokenScopes
          : tokenScopes
          ? tokenScopes.split(' ')
          : [],
      };
    } catch (e) {
      throw new InternalServerErrorException('Invalid token', { cause: e });
    }
  }

  public async tokenRevocation(token: string): Promise<{ token: string }> {
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

  public async interactionDetails(req: Request, res: Response): Promise<any> {
    try {
      const fetchOptions: any = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cookies: req.cookies,
          headers: req.headers,
          url: req.url,
        }),
      };

      const response = await fetch(DOMAIN + '/oidc/api/interaction/details', fetchOptions);

      if (!response.ok) {
        console.error('[OIDC-BACKEND] interactionDetails: ошибка', response);
        throw new BadRequestException(`Interaction details failed: ${response.status}`);
      }

      return await response.json();
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

    return res.redirect(`/oidc/auth/${uid}`);
  }

  public async getGrant(grantId: string): Promise<any> {
    try {
      const response = await fetch(DOMAIN + `/oidc/api/grants/${grantId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
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
        headers: {
          'Content-Type': 'application/json',
        },
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
        headers: {
          'Content-Type': 'application/json',
        },
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
}
