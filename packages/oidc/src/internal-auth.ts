import { randomBytes, timingSafeEqual } from "crypto";
import type Redis from "ioredis";
import type { Middleware } from "koa";
import { INTERNAL_REQUEST_HEADER } from "./constants.js";
import { createRedisClient } from "./redis.client.js";

const INTERNAL_REQUEST_TOKEN_KEY = "InternalRequestToken";
const INTERNAL_REQUEST_PREVIOUS_TOKEN_KEY = "InternalRequestTokenPrevious";
const INTERNAL_REQUEST_ROTATION_MS = 15 * 60 * 1000;
const INTERNAL_REQUEST_PREVIOUS_TOKEN_TTL_SEC = 120;
const INTERNAL_REQUEST_TOKEN_CACHE_MS = 30 * 1000;

let redis: Redis | undefined;
let cachedToken: { value: string; expiresAt: number } | undefined;

function getRedisClient(): Redis {
  if (!redis || redis.status === "end" || redis.status === "close") {
    redis = createRedisClient();
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

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function createToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function ensureInternalRequestToken(): Promise<string> {
  const cached = getCachedToken();
  if (cached) {
    return cached;
  }

  const client = getRedisClient();
  const existingToken = await client.get(INTERNAL_REQUEST_TOKEN_KEY);
  if (existingToken) {
    return setCachedToken(existingToken);
  }

  const token = createToken();
  await client.set(INTERNAL_REQUEST_TOKEN_KEY, token, "NX");

  return setCachedToken((await client.get(INTERNAL_REQUEST_TOKEN_KEY)) || token);
}

async function rotateInternalRequestToken(): Promise<void> {
  const currentToken = await ensureInternalRequestToken();
  const nextToken = createToken();

  await getRedisClient()
    .multi()
    .set(
      INTERNAL_REQUEST_PREVIOUS_TOKEN_KEY,
      currentToken,
      "EX",
      INTERNAL_REQUEST_PREVIOUS_TOKEN_TTL_SEC
    )
    .set(INTERNAL_REQUEST_TOKEN_KEY, nextToken)
    .exec();
  setCachedToken(nextToken);
}

export function startInternalRequestTokenRotation(): void {
  void ensureInternalRequestToken();

  setInterval(() => {
    rotateInternalRequestToken().catch((error) => {
      console.error("[OIDC] Failed to rotate internal request token:", error);
    });
  }, INTERNAL_REQUEST_ROTATION_MS).unref();
}

export function requireInternalRequest(): Middleware {
  return async (ctx, next) => {
    const token = ctx.get(INTERNAL_REQUEST_HEADER);
    if (!token) {
      ctx.status = 404;
      ctx.body = { error: "not_found" };
      return;
    }

    try {
      const currentToken = await ensureInternalRequestToken();
      const previousToken = await getRedisClient().get(INTERNAL_REQUEST_PREVIOUS_TOKEN_KEY);
      const isValidCurrentToken = currentToken ? safeEqual(token, currentToken) : false;
      const isValidPreviousToken = previousToken ? safeEqual(token, previousToken) : false;

      if (!isValidCurrentToken && !isValidPreviousToken) {
        ctx.status = 404;
        ctx.body = { error: "not_found" };
        return;
      }
    } catch (error) {
      console.error("[OIDC] Failed to verify internal request:", error);
      ctx.status = 404;
      ctx.body = { error: "not_found" };
      return;
    }

    await next();
  };
}
