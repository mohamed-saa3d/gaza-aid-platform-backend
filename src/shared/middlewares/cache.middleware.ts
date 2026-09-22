import type { RequestHandler } from 'express';
import redisClient, { withRedisTimeout } from '../../config/redis.config';
import logger from '../utils/logger';

const inFlightRequests = new Map<string, Promise<void>>();

export const useCache = (prefix: string, ttlSeconds: number): RequestHandler => {
  return async (req, res, next) => {
    const key = `${prefix}:${req.originalUrl}`;

    try {
      if (!redisClient || !redisClient.isReady) {
        return next();
      }

      const cached = await withRedisTimeout(redisClient.get(key));

      if (cached) {
        const body = JSON.parse(cached);
        res.status(200).json(body);
        return;
      }

      const inFlight = inFlightRequests.get(key);

      if (inFlight) {
        await inFlight;
        const coalescedCached = await withRedisTimeout(redisClient.get(key));

        if (coalescedCached) {
          res.status(200).json(JSON.parse(coalescedCached));
          return;
        }
      }

      let resolveFlight!: () => void;
      const flight = new Promise<void>((resolve) => {
        resolveFlight = resolve;
      });
      inFlightRequests.set(key, flight);

      // hijack res.json to save response into cache
      const originalJson = res.json.bind(res);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      res.json = (body: any) => {
        try {
          if (redisClient && redisClient.isReady) {
            // fire-and-forget so we don't block the response
            // @ts-ignore - setEx returns a promise
            redisClient
              .setEx(key, ttlSeconds, JSON.stringify(body))
              .catch((err: unknown) => logger.warn('Failed to set cache for', key, err))
              .finally(() => resolveFlight());
          } else {
            resolveFlight();
          }
        } catch (err) {
          logger.warn('Failed to set cache for', key, err);
          resolveFlight();
        }

        return originalJson(body);
      };

      res.once('close', () => {
        resolveFlight();
        inFlightRequests.delete(key);
      });
      res.once('finish', () => {
        inFlightRequests.delete(key);
      });

      next();
    } catch (err) {
      // fail-safe: log and continue to DB
      logger.warn('Cache middleware error', err);
      return next();
    }
  };
};

export default useCache;
