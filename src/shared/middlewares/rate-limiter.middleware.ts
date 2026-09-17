import rateLimit, {
  MemoryStore,
  type IncrementResponse,
  type Options,
  type Store,
} from 'express-rate-limit';
import { env } from '../../config/env';
import { RedisStore } from 'rate-limit-redis';
import redisClient from '../../config/redis.config';
import logger from '../utils/logger';

class ResilientRedisStore implements Store {
  private readonly redisStore: Store = new RedisStore({
    sendCommand: async (...args: string[]) => {
      if (!redisClient.isReady) {
        throw new Error('Redis is unavailable');
      }

      return redisClient.sendCommand(args);
    },
  });

  private readonly memoryStore = new MemoryStore();

  init(options: Options): void {
    this.memoryStore.init(options);

    if (!redisClient.isReady) {
      return;
    }

    try {
      const initialization = this.redisStore.init?.(options) as unknown;

      if (initialization instanceof Promise) {
        initialization.catch((error: unknown) => {
          logger.warn('Redis rate-limit store initialization failed; using memory fallback', error);
        });
      }
    } catch (error) {
      logger.warn('Redis rate-limit store initialization failed; using memory fallback', error);
    }
  }

  async increment(key: string): Promise<IncrementResponse> {
    try {
      if (!redisClient.isReady) {
        return this.memoryStore.increment(key);
      }

      return await this.redisStore.increment(key);
    } catch {
      return this.memoryStore.increment(key);
    }
  }

  async decrement(key: string): Promise<void> {
    try {
      if (redisClient.isReady) {
        await this.redisStore.decrement?.(key);
      }
    } catch {
      await this.memoryStore.decrement(key);
    }
  }

  async resetKey(key: string): Promise<void> {
    try {
      if (redisClient.isReady) {
        await this.redisStore.resetKey?.(key);
      }
    } catch {
      await this.memoryStore.resetKey(key);
    }
  }
}

export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
  store: new ResilientRedisStore(),
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts, please try again after 15 minutes.',
  },
  store: new ResilientRedisStore(),
});

export const sensitiveOpsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Action limit reached. Please slow down.',
  },
});

export const createAdminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many admin creation attempts from this IP, please try again after 15 minutes.',
  },
  store: new ResilientRedisStore(),
});

export const loginLimiter = authRateLimiter;
export const otpLimiter = authRateLimiter;
