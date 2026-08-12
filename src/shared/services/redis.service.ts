import redisClient from '../../config/redis.config';

export const redisService = {
  async clearCachePattern(pattern: string) {
    try {
      if (!redisClient || !redisClient.isOpen) return;

      const keys: string[] = [];
      // use scanIterator for efficient iteration
      // @ts-ignore - scanIterator exists on redis client v4
      for await (const key of redisClient.scanIterator({ MATCH: pattern })) {
        keys.push(key as string);
      }

      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('redisService.clearCachePattern failed', err);
    }
  },
};

export default redisService;
