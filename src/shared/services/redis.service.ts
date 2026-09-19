import redisClient from '../../config/redis.config';
import logger from '../utils/logger';

export const redisService = {
  async clearCache(...prefixes: string[]) {
    if (!redisClient.isReady) {
      throw new Error('Redis is not ready; cache invalidation was not performed.');
    }

    const patterns = prefixes.flatMap((prefix) => {
      const value = prefix.trim();
      if (!value) {
        return [];
      }

      return [value, `${value}:*`, `${value}*`];
    });

    const uniqueKeys = new Set<string>();

    for (const pattern of patterns) {
      // @ts-ignore - scanIterator exists on redis client v4
      for await (const key of redisClient.scanIterator({ MATCH: pattern })) {
        const keys = Array.isArray(key) ? key.map(String) : [String(key)];
        keys.forEach((entry) => uniqueKeys.add(entry));
      }
    }

    if (uniqueKeys.size > 0) {
      await Promise.all([...uniqueKeys].map((key) => redisClient.del(key)));
    }
  },

  async clearCachePattern(pattern: string) {
    if (!redisClient.isReady) {
      throw new Error('Redis is not ready; cache invalidation was not performed.');
    }

    const keys: string[] = [];
    // @ts-ignore - scanIterator exists on redis client v4
    for await (const key of redisClient.scanIterator({ MATCH: pattern })) {
      keys.push(...(Array.isArray(key) ? key.map(String) : [String(key)]));
    }

    if (keys.length > 0) {
      await Promise.all(keys.map((key) => redisClient.del(key)));
    }
  },
};

export default redisService;
