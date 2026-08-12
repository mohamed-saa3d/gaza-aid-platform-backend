import { createClient } from 'redis';
import logger from '../shared/utils/logger';

const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';

export const redisClient = createClient({ url: redisUrl });

redisClient.on('error', (err: unknown) => {
  logger.error('Redis client error', err);
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
    logger.warn('Redis connection failed:', err);
  }
})();

export default redisClient;
