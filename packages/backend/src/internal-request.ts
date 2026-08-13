import { randomBytes } from 'crypto';
import type Redis from 'ioredis';
import { redisClient } from './modules/redis/redis.client';

const INTERNAL_REQUEST_TOKEN_KEY = 'oidc:InternalRequestToken';
const INTERNAL_REQUEST_TOKEN_CACHE_MS = 30 * 1000;

let redis: Redis | undefined;
let cachedToken: { value: string; expiresAt: number } | undefined;

function getRedisClient(): Redis {
  if (!redis || redis.status === 'end' || redis.status === 'close') {
    redis = redisClient('internal-request');
  }

  return redis;
}

function setCachedToken(value: string): string {
  cachedToken = {
    value,
    expiresAt: Date.now() + INTERNAL_REQUEST_TOKEN_CACHE_MS,
  };

  return value;
}

function getCachedToken(): string | undefined {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }

  return undefined;
}

async function getInternalRequestToken(): Promise<string> {
  const cached = getCachedToken();
  if (cached) {
    return cached;
  }

  try {
    const client = getRedisClient();
    const existingToken = await client.get(INTERNAL_REQUEST_TOKEN_KEY);
    if (existingToken) {
      return setCachedToken(existingToken);
    }

    const token = randomBytes(32).toString('base64url');
    await client.set(INTERNAL_REQUEST_TOKEN_KEY, token, 'NX');

    return setCachedToken((await client.get(INTERNAL_REQUEST_TOKEN_KEY)) || token);
  } catch (error) {
    const fallback = getCachedToken();
    if (fallback) {
      return fallback;
    }

    throw error;
  }
}

export async function getInternalRequestHeaders() {
  return {
    'Content-Type': 'application/json',
    'x-trusted-internal-token': await getInternalRequestToken(),
  };
}
