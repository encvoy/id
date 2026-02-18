import Redis from 'ioredis';
import { REDIS_HOST, REDIS_PORT } from '../../constants';

/**
 * Redis client
 */
export const redisClient = (key: string) => {
  const getRedisConfig = () => ({
    host: process.env['REDIS_HOST'] || REDIS_HOST,
    port: parseInt(process.env['REDIS_PORT'] || String(REDIS_PORT), 10),
  });

  const config = getRedisConfig();

  const client = new Redis(config.port, config.host, {
    retryStrategy: (times) => {
      const freshConfig = getRedisConfig();
      const delay = Math.min(times * 50, 2000);
      console.info(
        `[Redis ${key}] Reconnecting to ${freshConfig.host}:${freshConfig.port} in ${delay}ms (attempt ${times})`,
      );
      return delay;
    },
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: false,
  });

  client.on('error', (err) => {
    console.error('Redis ' + key + ' error: ', err);
  });

  client.on('connect', () => {
    const cfg = getRedisConfig();
    console.info(`Redis ${key} connected to ${cfg.host}:${cfg.port}`);
  });

  client.on('ready', () => {
    console.info(`Redis ${key} ready`);
  });

  client.on('reconnecting', () => {
    console.warn(`Redis ${key} reconnecting...`);
  });

  return client;
};
