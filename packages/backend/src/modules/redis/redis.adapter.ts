import { InternalServerErrorException } from '@nestjs/common/exceptions/internal-server-error.exception';
import { Client } from '@prisma/client';
import type Redis from 'ioredis';
import { Ei18nCodes } from 'src/enums';
import * as helpers from '../../helpers';
import { UpdateClientDto } from '../clients/clients.dto';
import { prisma } from '../prisma/prisma.client';
import { redisClient } from './redis.client';

interface Adapter {
  upsert(id: string, payload: any, expiresIn?: number): Promise<void>;
  find(id: string): Promise<any>;
  findByUid?(uid: string): Promise<any>;
  findByUserCode?(userCode: string): Promise<any>;
  destroy(id: string): Promise<void>;
  consume?(id: string): Promise<void>;
  revokeByGrantId?(grantId: string): Promise<void>;
}

type TLoggedUserInfo = {
  id: number;
  nickname: string;
  picture: string;
  sessionToken: string;
};

let client: Redis;

// Функция для получения активного клиента
function getClient(): Redis {
  if (!client || client.status === 'end' || client.status === 'close') {
    client = redisClient('oidc:');
  }
  return client;
}

const grantable = new Set([
  'AccessToken',
  'AuthorizationCode',
  'RefreshToken',
  'DeviceCode',
  'BackchannelAuthenticationRequest',
]);

const consumable = new Set(['AuthorizationCode', 'RefreshToken', 'DeviceCode']);

export enum REDIS_PREFIXES {
  grant = 'grant',
  userCode = 'userCode',
  uid = 'uid',
  Session = 'Session',
  State = 'State',
  RequiredAccountsInfo = 'RequiredAccountsInfo',
  MailAuthorizationCode = 'MailAuthorizationCode',
  MailRegisterCode = 'MailRegisterCode',
  MailChangeCode = 'MailChangeCode',
  MailAddCode = 'MailAddCode',
  MailRecoverPasswordCode = 'MailRecoverPasswordCode',
  LoggedUserInfoCode = 'LoggedUserInfoCode',
  RateLimit = 'RateLimit',
  RateLimitSlidingWindow = 'RateLimitSlidingWindow',
  LoggedUserToken = 'LoggedUserToken',
  PhoneAuthorizationCode = 'PhoneAuthorizationCode',
  PhoneAddCode = 'PhoneAddCode',
  Interaction = 'Interaction',
  EthereumNonce = 'EthereumNonce',
  WebauthnRegistration = 'WebauthnRegistration',
  WebauthnAuthorization = 'WebauthnAuthorization',
  MtlsAuthorization = 'MtlsAuthorization',
  MtlsRegistration = 'MtlsRegistration',
  Totp = 'Totp',
  TwoFactorAuthentication = 'TwoFactorAuthentication',
  MFA1 = 'MFA1',
  MFA2 = 'MFA2',
  BindData = 'BindData',
  UserData = 'UserData',
  EmailCode = 'EmailCode',
}

/**
 * RedisAdapter implements oidc-provider.Adapter.
 */
export class RedisAdapter implements Adapter {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  /**
   * Finding client by ID.
   */
  async findClient(id: string): Promise<Client | null> {
    // Get client data from the DB
    const client = await prisma.client.findUnique({
      where: { client_id: id },
    });

    if (!client) return null;

    return client;
  }

  async upsertClient(
    id: string,
    {
      widget_colors,
      show_avatar_in_widget,
      hide_widget_footer,
      hide_widget_header,
      hide_widget_create_account,
      required_providers_ids,
      jwks_uri,
      ...restDto
    }: Omit<
      UpdateClientDto,
      'client_id' | 'client_ecret' | 'require_auth_time' | 'require_signed_request_object'
    > & {
      client_id: string;
      client_secret: string;
      require_auth_time?: boolean;
      require_signed_request_object?: boolean;
      jwks_uri?: string;
    },
  ) {
    try {
      const { client_secret } =
        (await prisma.client.findUnique({
          where: { client_id: id },
          select: { client_secret: true },
        })) || {};

      const widgetColors = helpers.removeEmptyValues(widget_colors);

      const data = {
        client_id: restDto.client_id || id,
        client_secret: restDto.client_secret || client_secret,
        widget_colors: helpers.isEmpty(widgetColors) ? undefined : widgetColors,
        required_providers_ids: required_providers_ids?.filter((id) => !!id),
        show_avatar_in_widget,
        hide_widget_footer,
        hide_widget_header,
        hide_widget_create_account,
        ...restDto,
      };

      await prisma.client.upsert({
        where: { client_id: id },
        update: data,
        create: data,
      });
    } catch (e) {
      throw new InternalServerErrorException(Ei18nCodes.T3E0078, { cause: e });
    }
  }

  //#region oidc-provider methods
  /**
   * Creates a new entry in Redis based on the provided ID and data.
   * oidc-provider uses this method.
   */
  public async upsert(id: string, payload: any, expiresIn?: number): Promise<void> {
    const key = this.formatRedisKey(id);
    const multi = getClient().multi();
    let store;

    let currentTTL: number | null = null;
    if (expiresIn === undefined) {
      currentTTL = await getClient().ttl(key);
      if (currentTTL <= 0) {
        currentTTL = null;
      }
    }

    if (consumable.has(this.name)) {
      store = { payload: JSON.stringify(payload) };
      multi['hmset'](key, store);
    } else {
      store = JSON.stringify(payload);
      multi['set'](key, store);
    }

    const effectiveExpiresIn = expiresIn ?? currentTTL;
    if (effectiveExpiresIn && effectiveExpiresIn > 0) {
      multi.expire(key, effectiveExpiresIn);
    }

    if (grantable.has(this.name) && payload.grantId) {
      const grantKey = this.formatRedisKey(payload.grantId, REDIS_PREFIXES.grant);
      multi.rpush(grantKey, key);
      const grantTTL = await getClient().ttl(grantKey);
      const grantExpiresIn = expiresIn ?? grantTTL;
      if (grantExpiresIn && grantExpiresIn > 0 && grantExpiresIn > grantTTL) {
        multi.expire(grantKey, grantExpiresIn);
      }
    }

    if (payload.userCode) {
      const userCodeKey = this.formatRedisKey(payload.userCode, REDIS_PREFIXES.userCode);
      multi.set(userCodeKey, id);
      if (effectiveExpiresIn && effectiveExpiresIn > 0) {
        multi.expire(userCodeKey, effectiveExpiresIn);
      }
    }

    if (payload.uid) {
      const uidKey = this.formatRedisKey(payload.uid, REDIS_PREFIXES.uid);
      multi.set(uidKey, id);
      if (effectiveExpiresIn && effectiveExpiresIn > 0) {
        multi.expire(uidKey, effectiveExpiresIn);
      }
    }

    await multi.exec();

    if (this.name === 'Client') {
      await this.upsertClient(id, payload);
    }
  }

  /**
   * Finds and retrieves data from Redis based on the provided ID.
   * oidc-provider uses this method.
   */
  public async find(id: string): Promise<any> {
    let data = consumable.has(this.name)
      ? await getClient().hgetall(this.formatRedisKey(id))
      : await getClient().get(this.formatRedisKey(id));

    if (this.name === 'Client') return this.findClient(id);

    if (helpers.isEmpty(data)) {
      return undefined;
    }

    if (typeof data === 'string') {
      return JSON.parse(data);
    }

    const { payload, ...rest } = data;
    return {
      ...rest,
      ...JSON.parse(payload),
    };
  }

  /**
   * Finds data by uid.
   * oidc-provider uses this method.
   */
  public async findByUid(uid: string): Promise<any> {
    const id = await getClient().get(this.formatRedisKey(uid, REDIS_PREFIXES.uid));
    return this.find(id);
  }

  /**
   * Finds data by user code.
   * oidc-provider uses this method.
   */
  public async findByUserCode(userCode: string): Promise<any> {
    const id = await getClient().get(this.formatRedisKey(userCode, REDIS_PREFIXES.userCode));
    return this.find(id);
  }

  /**
   * Revokes data by ID.
   * oidc-provider uses this method.
   */
  public async revokeByGrantId(grantId: string): Promise<void> {
    const grantKey = this.formatRedisKey(grantId, REDIS_PREFIXES.grant);
    const multi = getClient().multi();
    const tokens = await getClient().lrange(grantKey, 0, -1);
    tokens.forEach((token) => multi.del(token));
    multi.del(grantKey);
    await multi.exec();
  }

  /**
   * Revokes data by user code.
   * oidc-provider uses this method.
   */
  async destroy(id: string): Promise<void> {
    const key = this.formatRedisKey(id);
    await getClient().del(key);
  }

  /**
   * Creates a new session.
   * oidc-provider uses this method.
   */
  async consume(id: string): Promise<void> {
    await getClient().hset(this.formatRedisKey(id), 'consumed', Math.floor(Date.now() / 1000));
  }
  //#endregion

  /**
   * Gets data from Redis by key.
   */
  public async get<T = any>(id: string, prefix?: REDIS_PREFIXES): Promise<T> {
    try {
      const data = await getClient().get(this.formatRedisKey(id, prefix || this.name));
      const result = typeof data === 'string' ? JSON.parse(data) : undefined;
      return result;
    } catch (e) {
      throw new InternalServerErrorException(`Failed to get key data: ${prefix || this.name}`, {
        cause: e,
      });
    }
  }

  async fullOidcCleanupByUserId(userId: string) {
    const types = [
      'AccessToken',
      'RefreshToken',
      'AuthorizationCode',
      'DeviceCode',
      'BackchannelAuthenticationRequest',
    ];
    for (const type of types) {
      const keys: string[] = [];
      const stream = getClient().scanStream({ match: `oidc:${type}:*`, count: 100 });
      await new Promise((resolve) => {
        stream.on('data', (foundKeys: string[]) => keys.push(...foundKeys));
        stream.on('end', resolve);
      });
      for (const key of keys) {
        try {
          let data;
          if (consumable.has(type)) {
            // AuthorizationCode, RefreshToken, DeviceCode are stored as a hash
            const hashData = await getClient().hgetall(key);
            data = hashData?.payload;
          } else {
            // AccessToken and others are stored as string
            data = await getClient().get(key);
          }

          if (data) {
            const payload = typeof data === 'string' ? JSON.parse(data) : data;
            if (payload?.accountId === userId) {
              await getClient().del(key);
            }
          }
        } catch (error) {
          console.error(`[fullOidcCleanupByUserId] Error processing ${type} ${key}:`, error);
        }
      }
    }
    // Remove all Grant* (string) associated with userId
    const grantStringKeys: string[] = [];
    const grantStringStream = getClient().scanStream({ match: 'oidc:Grant*', count: 100 });
    await new Promise((resolve) => {
      grantStringStream.on('data', (keys: string[]) => grantStringKeys.push(...keys));
      grantStringStream.on('end', resolve);
    });
    for (const key of grantStringKeys) {
      try {
        const data = await getClient().get(key);
        if (data) {
          const grant = JSON.parse(data);
          if (grant?.accountId === userId) {
            await getClient().del(key);
          }
        }
      } catch (error) {
        console.error(`[fullOidcCleanupByUserId] Error processing Grant ${key}:`, error);
      }
    }

    // Remove all grant* (list) associated with userId
    const grantListKeys: string[] = [];
    const grantListStream = getClient().scanStream({ match: 'oidc:grant*', count: 100 });
    await new Promise((resolve) => {
      grantListStream.on('data', (keys: string[]) => grantListKeys.push(...keys));
      grantListStream.on('end', resolve);
    });
    for (const key of grantListKeys) {
      try {
        const tokens = await getClient().lrange(key, 0, -1);
        let shouldDelete = false;
        for (const tokenKey of tokens) {
          let data;
          const tokenType = tokenKey.split(':')[1]; // Get the token type

          if (consumable.has(tokenType)) {
            data = (await getClient().hgetall(tokenKey))?.payload;
          } else {
            data = await getClient().get(tokenKey);
          }

          if (data) {
            try {
              const payload = typeof data === 'string' ? JSON.parse(data) : data;
              if (payload?.accountId === userId) {
                await getClient().del(tokenKey);
                shouldDelete = true;
              }
            } catch {}
          }
        }
        if (shouldDelete) {
          await getClient().del(key);
        }
      } catch (error) {
        await getClient().del(key);
      }
    }
  }

  /**
   * Revokes all user tokens
   */
  async revokeAllTokensByUserId(userId: string, cookie?: any) {
    const stream = getClient().scanStream({
      match: 'oidc:Session*',
      count: 100,
    });

    const streamPromise = (): Promise<void> => {
      return new Promise((resolve, reject) => {
        stream.on('data', async (resultKeys) => {
          for (let i = 0; i < resultKeys.length; i++) {
            const data = await getClient().get(resultKeys[i]);
            if (!data) continue;
            const session = JSON.parse(data);

            if (session?.accountId === userId) {
              for (const [key, { sid, grantId }] of helpers.getObjectEntries(
                session.authorizations,
              )) {
                await this.revokeByGrantId(grantId);
              }
              await getClient().del(resultKeys[i]);
            }
          }
        });

        stream.on('end', () => {
          return resolve();
        });

        stream.on('error', (e) => {
          console.error('[revokeAllTokensByUserId] stream error:', e);
          reject(e);
        });
      });
    };

    await streamPromise();
    await this.deleteLoggedSessionsByUserId(userId, cookie);
    await this.fullOidcCleanupByUserId(userId);
  }

  /**
   * Revokes all user tokens by client_id
   */
  async revokeAllTokensByUserAndClientId(userId: string, client_id: string, cookie) {
    const stream = getClient().scanStream({
      match: 'oidc:Session*',
      count: 100,
    });

    const streamPromise = (): Promise<void> => {
      return new Promise((resolve, reject) => {
        stream.on('data', async (resultKeys) => {
          for (let i = 0; i < resultKeys.length; i++) {
            const data = await getClient().get(resultKeys[i]);
            const session = JSON.parse(data);

            if (session?.accountId === userId) {
              for (const [key, { sid, grantId }] of helpers.getObjectEntries(
                session.authorizations,
              )) {
                if (key === client_id) {
                  // Revoke grant and all its tokens
                  await this.revokeByGrantId(grantId);

                  // Remove only this client's authorization from the session, not the whole session
                  delete session.authorizations[client_id];

                  // If session has no more authorizations, delete it; otherwise update it
                  if (Object.keys(session.authorizations).length === 0) {
                    await getClient().del(resultKeys[i]);
                  } else {
                    await getClient().set(resultKeys[i], JSON.stringify(session));
                  }
                }
              }
            }
          }
        });

        stream.on('end', () => {
          return resolve();
        });

        stream.on('error', (e) => {
          console.error('[revokeAllTokensByUserAndClientId] stream error:', e);
          reject(e);
        });
      });
    };

    await streamPromise();
    await this.deleteLoggedSessionsByUserId(userId, cookie);
  }

  async revokeGrants(userId: string, client_id: string) {
    try {
      const stream = getClient().scanStream({
        match: 'oidc:grant*',
        count: 100,
      });

      const streamPromise = (): Promise<void> => {
        return new Promise((resolve, reject) => {
          stream.on('data', async (resultKeys) => {
            for (let i = 0; i < resultKeys.length; i++) {
              const currentKey = resultKeys[i];
              // Grant is stored as a list of tokens
              const tokens = await getClient().lrange(currentKey, 0, -1);
              let shouldDelete = false;
              for (const tokenKey of tokens) {
                let data = await getClient().get(tokenKey);
                if (!data && consumable.has(tokenKey.split(':').pop())) {
                  data = (await getClient().hgetall(tokenKey))?.payload;
                }
                if (data) {
                  try {
                    const payload = typeof data === 'string' ? JSON.parse(data) : data;
                    if (payload?.accountId === userId && payload?.clientId === client_id) {
                      shouldDelete = true;
                      break;
                    }
                  } catch {}
                }
              }
              if (shouldDelete) {
                const multi = getClient().multi();
                multi.del(currentKey);
                await multi.exec();
              }
            }
          });

          stream.on('end', () => {
            return resolve();
          });

          stream.on('error', (e) => {
            console.error('[revokeGrants] stream error:', e);
            reject(e);
          });
        });
      };

      await streamPromise();
    } catch (e) {
      throw new InternalServerErrorException('Failed to revoke grants', { cause: e });
    }
  }

  async deleteLoggedSessionsByUserId(userId: string, cookie?: any) {
    try {
      const streamPromise = (): Promise<string[]> => {
        return new Promise((resolve, reject) => {
          const resultKeys: string[] = [];
          const stream = getClient().scanStream({
            match: 'LoggedUserInfoCode:*',
            count: 100,
          });

          stream.on('data', (keys: string[]) => {
            resultKeys.push(...keys);
          });

          stream.on('end', () => {
            resolve(resultKeys);
          });

          stream.on('error', (e) => {
            console.error('[deleteLoggedSessionsByUserId] stream error:', e);
            reject(e);
          });
        });
      };

      const resultKeys = await streamPromise();
      let sessionCookie = cookie?.get('_sess');

      if (!sessionCookie) return;

      sessionCookie = decodeURIComponent(sessionCookie);
      let cookieModified = false;

      await Promise.all(
        resultKeys.map(async (key) => {
          try {
            const data = await getClient().get(key);
            if (!data) return;

            const info: TLoggedUserInfo = JSON.parse(data);

            if (info?.id === parseInt(userId, 10)) {
              const sessionId = key.replace('LoggedUserInfoCode:', '');

              // Remove sessionId from the cookie (check different possible formats)
              const patterns = [
                new RegExp(`${sessionId},?`, 'g'), // sessionId with a comma
                new RegExp(`,${sessionId}`, 'g'), // comma with sessionId
                new RegExp(`^${sessionId}$`, 'g'), // sessionId only
              ];

              let newSessionCookie = sessionCookie;
              patterns.forEach((pattern) => {
                newSessionCookie = newSessionCookie.replace(pattern, '');
              });

              // Clear excess commas
              newSessionCookie = newSessionCookie.replace(/,,+/g, ',').replace(/^,|,$/g, '');

              if (newSessionCookie !== sessionCookie) {
                sessionCookie = newSessionCookie;
                cookieModified = true;
              }

              await getClient().del(key);
            }
          } catch (error) {
            console.error(`[deleteLoggedSessionsByUserId] Error processing key ${key}:`, error);
          }
        }),
      );

      // Update the cookie only once at the end if there were changes
      if (cookieModified) {
        const cookieOptions = {
          httpOnly: true,
          overwrite: true,
        };
        cookie.set('_sess', sessionCookie || '', cookieOptions);
      }
    } catch (error) {
      console.error('[deleteLoggedSessionsByUserId] error:', error);
      throw error;
    }
  }

  /**
   * Generates a Redis key based on a prefix and a value.
   */
  private formatRedisKey(key: string, prefix?: string): string {
    return `${prefix || this.name}:${key}`;
  }
}
