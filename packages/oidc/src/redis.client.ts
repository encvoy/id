import Redis from "ioredis";

export function createRedisClient(keyPrefix?: string): Redis {
  const prefix = keyPrefix || "oidc:";

  const getRedisConfig = () => ({
    host: process.env["REDIS_HOST"] || "127.0.0.1",
    port: parseInt(process.env["REDIS_PORT"] || "6379", 10),
  });

  const config = getRedisConfig();

  const client = new Redis(config.port, config.host, {
    keyPrefix: prefix,
    retryStrategy: (times) => {
      const freshConfig = getRedisConfig();
      const delay = Math.min(times * 50, 2000);
      console.info(
        `[OIDC Redis] Reconnecting to ${freshConfig.host}:${freshConfig.port} in ${delay}ms (attempt ${times})`
      );
      return delay;
    },
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: false,
  });

  client.on("error", (err) => {
    console.error("OIDC Redis error:", err);
  });

  client.on("connect", () => {
    const cfg = getRedisConfig();
    console.info(`OIDC Redis connected to ${cfg.host}:${cfg.port}`);
  });

  client.on("ready", () => {
    console.info("OIDC Redis ready");
  });

  client.on("reconnecting", () => {
    console.warn("OIDC Redis reconnecting...");
  });

  return client;
}

export const redisClient = createRedisClient();
