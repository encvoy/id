import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CLIENT_ID } from '../../constants';
import { ListInputDto } from '../../custom.dto';
import { NON_DELEGABLE_PERMISSIONS } from '../../role-permissions';
import { OidcService } from '../oidc/oidc.service';
import { redisClient } from '../redis/redis.client';

type TTokenRequest = {
  tokenPermissions?: string[];
};

type TStoredPersonalAccessToken = {
  id: string;
  user_id: string;
  client_id: string;
  name: string;
  permissions: string[];
  last4: string;
  created_at: string;
  expires_at: string | null;
  token_kind: 'personal_access';
  oidc_token_id?: string;
  oidc_grant_id?: string;
  token?: string;
};

type TPersonalAccessTokenListItem = Omit<
  TStoredPersonalAccessToken,
  'oidc_grant_id' | 'oidc_token_id' | 'token'
>;

type TCreatePersonalAccessTokenPayload = {
  name: string;
  permissions: string[];
  expires_in?: number;
  expires_at?: string;
  never_expires?: boolean;
};

type TResolvedTokenLifetime = {
  expiresIn?: number;
  expiresAt: string | null;
  neverExpires: boolean;
};

const DEFAULT_PERSONAL_ACCESS_TOKEN_TTL = 30 * 24 * 60 * 60;
const MIN_PERSONAL_ACCESS_TOKEN_TTL = 60;

function normalizePositiveNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined;
}

@Injectable()
export class TokensService {
  private readonly redis = redisClient('tokens');

  constructor(private readonly oidcService: OidcService) {}

  private getMetaKey(tokenId: string): string {
    return `pat:meta:${tokenId}`;
  }

  private getUserKey(userId: string): string {
    return `pat:user:${userId}`;
  }

  private normalizePermissions(value: string[] | undefined): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return Array.from(new Set(value.map((permission) => permission.trim()).filter(Boolean))).sort();
  }

  private getAvailablePermissionsForRequest(request: TTokenRequest): string[] {
    return this.normalizePermissions(request.tokenPermissions).filter(
      (permission) => !NON_DELEGABLE_PERMISSIONS.has(permission),
    );
  }

  private toListItem(token: TStoredPersonalAccessToken): TPersonalAccessTokenListItem {
    const {
      oidc_grant_id: _oidcGrantId,
      oidc_token_id: _oidcTokenId,
      token: _token,
      ...rest
    } = token;
    return rest;
  }

  private async getStoredToken(tokenId: string): Promise<TStoredPersonalAccessToken> {
    const payload = await this.redis.get(this.getMetaKey(tokenId));

    if (!payload) {
      throw new NotFoundException('Additional token not found');
    }

    return JSON.parse(payload) as TStoredPersonalAccessToken;
  }

  private resolveLifetime(payload: TCreatePersonalAccessTokenPayload): TResolvedTokenLifetime {
    if (payload.never_expires) {
      return {
        expiresAt: null,
        neverExpires: true,
      };
    }

    if (payload.expires_at) {
      const expiresAtDate = new Date(payload.expires_at);

      if (Number.isNaN(expiresAtDate.getTime())) {
        throw new BadRequestException('Invalid expiration date');
      }

      const expiresIn = Math.ceil((expiresAtDate.getTime() - Date.now()) / 1000);
      if (expiresIn < MIN_PERSONAL_ACCESS_TOKEN_TTL) {
        throw new BadRequestException('Expiration date must be at least 60 seconds in the future');
      }

      return {
        expiresIn,
        expiresAt: expiresAtDate.toISOString(),
        neverExpires: false,
      };
    }

    const expiresIn =
      normalizePositiveNumber(payload.expires_in) || DEFAULT_PERSONAL_ACCESS_TOKEN_TTL;

    return {
      expiresIn,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      neverExpires: false,
    };
  }

  async getAvailablePermissions(request: TTokenRequest) {
    return {
      permissions: this.getAvailablePermissionsForRequest(request),
    };
  }

  async list(params: ListInputDto, userId: string) {
    const limit = params.limit || 10;
    const offset = params.offset || 0;
    const userKey = this.getUserKey(userId);
    let totalCount = await this.redis.zcard(userKey);

    if (!totalCount) {
      return {
        items: [] as TPersonalAccessTokenListItem[],
        totalCount: 0,
      };
    }

    const tokenIds = await this.redis.zrevrange(userKey, offset, offset + limit - 1);
    if (!tokenIds.length) {
      return {
        items: [] as TPersonalAccessTokenListItem[],
        totalCount,
      };
    }

    const payloads = await this.redis.mget(
      tokenIds.map((itemTokenId) => this.getMetaKey(itemTokenId)),
    );
    const staleIds: string[] = [];
    const items: TPersonalAccessTokenListItem[] = [];

    payloads.forEach((payload, index) => {
      if (!payload) {
        staleIds.push(tokenIds[index]);
        return;
      }

      try {
        const token = JSON.parse(payload) as TStoredPersonalAccessToken;
        if (token.user_id !== userId) {
          staleIds.push(tokenIds[index]);
          return;
        }

        items.push(this.toListItem(token));
      } catch {
        staleIds.push(tokenIds[index]);
      }
    });

    if (staleIds.length) {
      await this.redis.zrem(userKey, ...staleIds);
      totalCount = await this.redis.zcard(userKey);
    }

    return {
      items,
      totalCount,
    };
  }

  async create(userId: string, payload: TCreatePersonalAccessTokenPayload) {
    const name = payload.name.trim();
    const permissions = this.normalizePermissions(payload.permissions);
    const lifetime = this.resolveLifetime(payload);

    const issuedToken = await this.oidcService.issuePersonalAccessToken({
      accountId: userId,
      clientId: CLIENT_ID,
      permissions,
      expiresIn: lifetime.expiresIn,
      neverExpires: lifetime.neverExpires,
      name,
    });

    const tokenId = randomUUID();
    const createdAt = new Date().toISOString();
    const ttl = lifetime.neverExpires
      ? undefined
      : normalizePositiveNumber(issuedToken.expires_in) ||
        lifetime.expiresIn ||
        (normalizePositiveNumber(issuedToken.exp)
          ? Math.max(1, issuedToken.exp - Math.floor(Date.now() / 1000))
          : undefined) ||
        DEFAULT_PERSONAL_ACCESS_TOKEN_TTL;
    const expiresAt = lifetime.neverExpires
      ? null
      : lifetime.expiresAt ||
        new Date(
          (normalizePositiveNumber(issuedToken.exp) || Math.floor(Date.now() / 1000) + ttl) * 1000,
        ).toISOString();
    const storedToken: TStoredPersonalAccessToken = {
      id: tokenId,
      user_id: userId,
      client_id: CLIENT_ID,
      name,
      permissions,
      last4: issuedToken.access_token.slice(-4),
      created_at: createdAt,
      expires_at: expiresAt,
      token_kind: 'personal_access',
      oidc_token_id: issuedToken.jti,
      ...(issuedToken.grant_id ? { oidc_grant_id: issuedToken.grant_id } : {}),
    };
    const userKey = this.getUserKey(userId);
    const multi = this.redis.multi();
    const currentUserKeyTtl = await this.redis.ttl(userKey);

    if (ttl) {
      multi.set(this.getMetaKey(tokenId), JSON.stringify(storedToken), 'EX', ttl);
    } else {
      multi.set(this.getMetaKey(tokenId), JSON.stringify(storedToken));
    }
    multi.zadd(userKey, Date.now(), tokenId);

    if (!ttl) {
      multi.persist(userKey);
    } else if (currentUserKeyTtl !== -1 && currentUserKeyTtl < ttl) {
      multi.expire(userKey, ttl);
    }

    await multi.exec();

    return {
      id: tokenId,
      name,
      access_token: issuedToken.access_token,
      token_type: issuedToken.token_type,
      expires_in: ttl || null,
      expires_at: expiresAt,
      permissions,
      last4: storedToken.last4,
    };
  }

  async revoke(tokenId: string, userId: string) {
    const token = await this.getStoredToken(tokenId);
    if (token.user_id !== userId) {
      throw new NotFoundException('Additional token not found');
    }

    if (token.oidc_token_id) {
      await this.oidcService.destroyAccessToken(token.oidc_token_id);
    } else if (token.oidc_grant_id) {
      await this.oidcService.revokeAccessTokenGrant(token.oidc_grant_id);
    } else if (token.token) {
      await this.oidcService.tokenRevocation(token.token);
    }

    const multi = this.redis.multi();
    multi.del(this.getMetaKey(tokenId));
    multi.zrem(this.getUserKey(userId), tokenId);
    await multi.exec();
  }
}
