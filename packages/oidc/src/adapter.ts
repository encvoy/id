import { Adapter as OidcAdapter } from "oidc-provider";
import { redisClient } from "./redis.client.js";
import type Redis from "ioredis";
import { prisma } from "./prisma.js";

const grantable = new Set([
  "AccessToken",
  "AuthorizationCode",
  "RefreshToken",
  "DeviceCode",
  "BackchannelAuthenticationRequest",
]);

const consumable = new Set(["AuthorizationCode", "RefreshToken", "DeviceCode"]);

/**
 * Prefixes for Redis keys
 */
enum REDIS_PREFIXES {
  grant = "grant",
  userCode = "userCode",
  uid = "uid",
}

/**
 * Adapter for oidc-provider v9
 * Support for dynamic clients via Prisma
 */
export class Adapter implements OidcAdapter {
  private client: Redis;
  public name: string;

  constructor(name: string) {
    this.name = name;
    this.client = redisClient;
  }

  /**
   * Find a client by ID (with _device support)
   * Used only within find for the Client type
   */
  async findClient(id: string): Promise<any | null> {
    // Get the client from the database
    const client = await prisma.client.findUnique({
      where: { client_id: id },
    });
    if (!client) return null;
    return client;
  }

  /**
   * Formats a Redis key based on the type and prefix
   */
  private formatRedisKey(id: string, prefix?: string): string {
    const keyPrefix = prefix || this.name;
    return `${keyPrefix}:${id}`;
  }

  /**
   * Creates or updates a record in Redis (and in the database for Clients)
   * oidc-provider v9 only calls upsert
   */
  async upsert(id: string, payload: any, expiresIn: number): Promise<void> {
    const key = this.formatRedisKey(id);
    const multi = this.client.multi();
    let store: any;

    if (consumable.has(this.name)) {
      // For consumable tokens, use the hash
      store = { payload: JSON.stringify(payload) };
      multi.hmset(key, store);
    } else {
      // For others, use a simple string
      store = JSON.stringify(payload);
      multi.set(key, store);
    }

    // Set the TTL
    if (expiresIn) {
      multi.expire(key, expiresIn);
    }

    // Associate it with the grant if it's a grantable token
    if (grantable.has(this.name) && payload.grantId) {
      const grantKey = this.formatRedisKey(
        payload.grantId,
        REDIS_PREFIXES.grant
      );
      multi.rpush(grantKey, key);
      const ttl = await this.client.ttl(grantKey);
      if (ttl === -1 || expiresIn > ttl) {
        multi.expire(grantKey, expiresIn);
      }
    }

    // Indexes for searching by userCode and uid
    if (payload.userCode) {
      const userCodeKey = this.formatRedisKey(
        payload.userCode,
        REDIS_PREFIXES.userCode
      );
      multi.set(userCodeKey, id);
      multi.expire(userCodeKey, expiresIn);
    }

    if (payload.uid) {
      const uidKey = this.formatRedisKey(payload.uid, REDIS_PREFIXES.uid);
      multi.set(uidKey, id);
      multi.expire(uidKey, expiresIn);
    }

    await multi.exec();

    // If it's a Client, update it in the database
    if (this.name === "Client") {
      await prisma.client.upsert({
        where: { client_id: id },
        update: payload,
        create: payload,
      });
    }
  }

  /**
   * Finds a record by ID
   * For clients, separate logic via findClient
   */
  async find(id: string): Promise<any> {
    if (this.name === "Client") {
      return this.findClient(id);
    }

    const key = this.formatRedisKey(id);
    let data: any;
    if (consumable.has(this.name)) {
      // For consumable tokens, read the hash
      data = await this.client.hgetall(key);
    } else {
      // For others, use a simple string
      data = await this.client.get(key);
    }
    if (!data || (typeof data === "object" && Object.keys(data).length === 0)) {
      return undefined;
    }
    if (typeof data === "string") {
      try {
        return JSON.parse(data);
      } catch (error) {
        console.error("Error parsing JSON from Redis:", error);
        return undefined;
      }
    }
    if (typeof data === "object" && data.payload) {
      const { payload, ...rest } = data;
      try {
        return {
          ...rest,
          ...JSON.parse(payload),
        };
      } catch (error) {
        console.error("Error parsing payload JSON from Redis:", error);
        return undefined;
      }
    }
    return data;
  }

  /**
   * Finds a record by UID
   */
  async findByUid(uid: string): Promise<any> {
    const uidKey = this.formatRedisKey(uid, REDIS_PREFIXES.uid);
    const id = await this.client.get(uidKey);

    if (!id) {
      return undefined;
    }

    return this.find(id);
  }

  /**
   * Finds a record by User Code (for device flow)
   */
  async findByUserCode(userCode: string): Promise<any> {
    const userCodeKey = this.formatRedisKey(userCode, REDIS_PREFIXES.userCode);
    const id = await this.client.get(userCodeKey);

    if (!id) {
      return undefined;
    }

    return this.find(id);
  }

  /**
   * Revokes all tokens by grantId
   */
  async revokeByGrantId(grantId: string): Promise<void> {
    const grantKey = this.formatRedisKey(grantId, REDIS_PREFIXES.grant);
    const multi = this.client.multi();

    // Get all tokens associated with the grant
    const tokens = await this.client.lrange(grantKey, 0, -1);

    // Delete all tokens
    tokens.forEach((token) => multi.del(token));

    // Delete the grant itself
    multi.del(grantKey);

    await multi.exec();
  }

  /**
   * Delete a record by ID
   */
  async destroy(id: string): Promise<void> {
    const key = this.formatRedisKey(id);
    await this.client.del(key);
  }

  /**
   * Marks a token as consumed
   */
  async consume(id: string): Promise<void> {
    const key = this.formatRedisKey(id);
    const consumedAt = Math.floor(Date.now() / 1000);

    if (consumable.has(this.name)) {
      // For hash-based tokens, add the consumed field
      await this.client.hset(key, "consumed", consumedAt);
    } else {
      // For other tokens, get the data, add the consumed field, and save it back
      const data = await this.find(id);
      if (data) {
        data.consumed = consumedAt;
        await this.client.set(key, JSON.stringify(data));
      }
    }
  }
}
