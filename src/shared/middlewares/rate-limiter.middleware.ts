import rateLimit, {
  MemoryStore,
  type IncrementResponse,
  type Options,
  type Store,
} from 'express-rate-limit';
import { env } from '../../config/env';
import { RedisStore } from 'rate-limit-redis';
import redisClient from '../../config/redis.config';

class ResilientRedisStore implements Store {
  private readonly redisStore: Store = new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
  });

  private readonly memoryStore = new MemoryStore();

  init(options: Options): void {
    this.redisStore.init?.(options);
    this.memoryStore.init(options);
  }

  async increment(key: string): Promise<IncrementResponse> {
    try {
      if (!redisClient.isOpen) {
        return this.memoryStore.increment(key);
      }

      return await this.redisStore.increment(key);
    } catch {
      return this.memoryStore.increment(key);
    }
  }

  async decrement(key: string): Promise<void> {
    try {
      if (redisClient.isOpen) {
        await this.redisStore.decrement?.(key);
      }
    } catch {
      await this.memoryStore.decrement(key);
    }
  }

  async resetKey(key: string): Promise<void> {
    try {
      if (redisClient.isOpen) {
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
