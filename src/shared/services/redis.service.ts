import redisClient from '../../config/redis.config';
import logger from '../utils/logger';

export const redisService = {
  async clearCache(...prefixes: string[]) {
    if (!redisClient.isReady) {
      const msg = `[Redis] Client not ready; cache invalidation skipped for: ${prefixes.join(', ')}`;
      logger.error(msg);
      throw new Error(msg);
    }

    const patterns = prefixes.flatMap((prefix) => {
      const value = prefix.trim();
      if (!value) {
        return [];
      }

      return [value, `${value}:*`, `${value}*`];
    });

    const backoffMs = [50, 200, 800];
    let lastError: unknown;

    for (let attempt = 0; attempt < backoffMs.length; attempt += 1) {
      try {
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

        const survivingKeys = new Set<string>();

        for (const pattern of patterns) {
          // @ts-ignore - scanIterator exists on redis client v4
          for await (const key of redisClient.scanIterator({ MATCH: pattern })) {
            const keys = Array.isArray(key) ? key.map(String) : [String(key)];
            keys.forEach((entry) => survivingKeys.add(entry));
          }
        }

        if (survivingKeys.size > 0) {
          const msg = `[Redis] clearCache left ${survivingKeys.size} key(s) behind for [${prefixes.join(', ')}]: ${[...survivingKeys].join(', ')}`;
          logger.error(msg);
          throw new Error(msg);
        }

        return;
      } catch (error) {
        lastError = error;
        const isLastAttempt = attempt === backoffMs.length - 1;
        const reason = error instanceof Error ? error.message : String(error);

        if (isLastAttempt) {
          break;
        }

        logger.warn(
          `[Redis] clearCache attempt ${attempt + 1}/${backoffMs.length} failed for [${prefixes.join(', ')}]: ${reason}. Retrying in ${backoffMs[attempt]}ms`,
        );
        await new Promise((resolve) => setTimeout(resolve, backoffMs[attempt]));
      }
    }

    const reason = lastError instanceof Error ? lastError.message : String(lastError);
    const msg = `[Redis] clearCache failed after ${backoffMs.length} attempts for [${prefixes.join(', ')}]: ${reason}`;
    logger.error(msg);
    throw new Error(msg);
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
