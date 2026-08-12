import redisClient from '../../config/redis.config';
import logger from '../utils/logger';

export const redisService = {
  async clearCachePattern(pattern: string) {
    try {
      if (!redisClient || !redisClient.isOpen) return;

      const keys: string[] = [];
      // use scanIterator for efficient iteration
      // @ts-ignore - scanIterator exists on redis client v4
      for await (const key of redisClient.scanIterator({ MATCH: pattern })) {
        keys.push(String(key));
      }

      if (keys.length > 0) {
        // delete keys individually to avoid typing issues across redis client versions
        await Promise.all(keys.map((k) => redisClient.del(k)));
      }
    } catch (err) {
      logger.warn('redisService.clearCachePattern failed', err);
    }
  },
};

export default redisService;
