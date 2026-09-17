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

(async () => {
  try {
    if (!redisClient.isOpen) await redisClient.connect();
  } catch (err) {
    logger.warn('Redis connection failed; continuing without Redis services', err);
  }
})();

export default redisClient;
