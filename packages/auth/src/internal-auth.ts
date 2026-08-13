import { randomBytes, timingSafeEqual } from "crypto";
import type { NextFunction, Request, Response } from "express";
import Redis from "ioredis";

const INTERNAL_REQUEST_HEADER = "x-trusted-internal-token";
const INTERNAL_REQUEST_TOKEN_KEY = "oidc:InternalRequestToken";
const INTERNAL_REQUEST_PREVIOUS_TOKEN_KEY = "oidc:InternalRequestTokenPrevious";
const INTERNAL_REQUEST_TOKEN_CACHE_MS = 30 * 1000;

let redis: Redis | undefined;
let cachedToken: { value: string; expiresAt: number } | undefined;

function getRedisClient(): Redis {
  if (!redis || redis.status === "end" || redis.status === "close") {
    redis = new Redis(
      parseInt(process.env.REDIS_PORT || "6379", 10),
      process.env.REDIS_HOST || "127.0.0.1",
      {
        retryStrategy: (times: number) => Math.min(times * 50, 2000),
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        lazyConnect: false,
      }
    );
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

async function getInternalRequestToken(): Promise<string> {
  const cached = getCachedToken();
  if (cached) {
    return cached;
  }

  const client = getRedisClient();
  const existingToken = await client.get(INTERNAL_REQUEST_TOKEN_KEY);
  if (existingToken) {
    return setCachedToken(existingToken);
  }

  const token = randomBytes(32).toString("base64url");
  await client.set(INTERNAL_REQUEST_TOKEN_KEY, token, "NX");

  return setCachedToken((await client.get(INTERNAL_REQUEST_TOKEN_KEY)) || token);
}

export async function requireInternalRequest(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.header(INTERNAL_REQUEST_HEADER);
    if (!token) {
      return res.status(404).json({ error: "not_found" });
    }

    const currentToken = await getInternalRequestToken();
    const previousToken = await getRedisClient().get(INTERNAL_REQUEST_PREVIOUS_TOKEN_KEY);
    const isValidCurrentToken = safeEqual(token || "", currentToken);
    const isValidPreviousToken = previousToken
      ? safeEqual(token || "", previousToken)
      : false;

    if (!token || (!isValidCurrentToken && !isValidPreviousToken)) {
      return res.status(404).json({ error: "not_found" });
    }

    return next();
  } catch (error) {
    console.error("Failed to verify internal request:", error);
    return res.status(404).json({ error: "not_found" });
  }
}
