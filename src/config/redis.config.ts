import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';

export const redisClient = createClient({ url: redisUrl });

redisClient.on('error', (err: unknown) => {
  // eslint-disable-next-line no-console
  console.error('Redis client error', err);
});

redisClient.on('connect', () => {
  // eslint-disable-next-line no-console
  console.info('Redis client connecting');
});

redisClient.on('ready', () => {
  // eslint-disable-next-line no-console
  console.info('Redis client ready');
});

(async () => {
  try {
    if (!redisClient.isOpen) await redisClient.connect();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Redis connection failed:', err);
  }
})();

export default redisClient;
