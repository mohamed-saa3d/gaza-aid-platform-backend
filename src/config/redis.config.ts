import { createClient } from 'redis';
import logger from '../shared/utils/logger';

const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
export const REDIS_COMMAND_TIMEOUT_MS = 1000;

export const redisClient = createClient({
  url: redisUrl,
  socket: {
    connectTimeout: 5000,
    reconnectStrategy: false,
  },
});

export const isRedisReady = (): boolean => redisClient.isReady;

export const withRedisTimeout = async <T>(operation: Promise<T>): Promise<T> => {
  let timeoutHandle: ReturnType<typeof setTimeout>;

  const timeout = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new Error('Redis command timed out')), REDIS_COMMAND_TIMEOUT_MS);
  });

  try {
    return await Promise.race([operation, timeout]);
  } finally {
    clearTimeout(timeoutHandle!);
  }
};

redisClient.on('error', (err: unknown) => {
  logger.warn('Redis unavailable; continuing without Redis services', err);
});

redisClient.on('connect', () => {
  logger.info('Redis client connecting');
});

redisClient.on('ready', () => {
  logger.info('Redis client ready');
});

let rateLimitKeysFlushed = false;

const flushDevelopmentRateLimitKeys = async (): Promise<void> => {
  if (process.env.NODE_ENV !== 'development' || rateLimitKeysFlushed) {
    return;
  }

  rateLimitKeysFlushed = true;
  const keys: string[] = [];

  for await (const key of redisClient.scanIterator({ MATCH: 'rl:*', COUNT: 100 })) {
    if (Array.isArray(key)) {
      keys.push(...key);
    } else {
      keys.push(key);
    }
  }

  if (keys.length > 0) {
    await redisClient.del(keys);
  }

  console.info(`[Dev Setup] Cleared ${keys.length} Redis rate limit keys on startup.`);
};

redisClient.on('ready', () => {
  void flushDevelopmentRateLimitKeys().catch((error: unknown) => {
    rateLimitKeysFlushed = false;
    logger.warn('Failed to clear development Redis rate limit keys.', error);
  });
});

const initRedis = async (): Promise<void> => {
  try {
    if (redisClient.isOpen) {
      return;
    }

    await redisClient.connect();
  } catch (error) {
    logger.warn('Redis connection failed; application running without cache/rate-limiting.', error);
  }
};

void initRedis().catch((error: unknown) => {
  logger.warn('Redis initialization failed; application running without cache/rate-limiting.', error);
});

export default redisClient;
