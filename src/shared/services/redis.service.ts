import redisClient from '../../config/redis.config';
import logger from '../utils/logger';

export const redisService = {
  async clearCachePattern(pattern: string) {
    if (!redisClient.isReady) {
      throw new Error('Redis is not ready; cache invalidation was not performed.');
    }

    const keys: string[] = [];
    // use scanIterator for efficient iteration
    // @ts-ignore - scanIterator exists on redis client v4
    for await (const key of redisClient.scanIterator({ MATCH: pattern })) {
      keys.push(...(Array.isArray(key) ? key.map(String) : [String(key)]));
    }

    if (keys.length > 0) {
      // delete keys individually to avoid typing issues across redis client versions
      await Promise.all(keys.map((key) => redisClient.del(key)));
    }
  },
};

export default redisService;
