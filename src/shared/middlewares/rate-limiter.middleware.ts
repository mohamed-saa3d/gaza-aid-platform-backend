import rateLimit, {
  ipKeyGenerator,
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

const developmentMultiplier = process.env.NODE_ENV === 'development' ? 10 : 1;

const createLimiter = ({
  group,
  windowMs,
  max,
  message,
  useRedis = true,
}: {
  group: string;
  windowMs: number;
  max: number;
  message: string;
  useRedis?: boolean;
}) =>
  rateLimit({
    windowMs,
    max: max * developmentMultiplier,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (request) => {
      const clientIp = ipKeyGenerator(request.ip ?? 'unknown');
      return `${group}:${request.baseUrl}${request.path}:${clientIp}`;
    },
    message: {
      success: false,
      message,
    },
    ...(useRedis ? { store: new ResilientRedisStore() } : {}),
  });

export const globalRateLimiter = createLimiter({
  group: 'global',
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many requests, please try again later.',
});

export const loginLimiter = createLimiter({
  group: 'login',
  windowMs: 3 * 60 * 1000,
  max: 15,
  message: 'Too many login attempts, please try again later.',
});

export const registerLimiter = createLimiter({
  group: 'register',
  windowMs: 3 * 60 * 1000,
  max: 15,
  message: 'Too many registration attempts, please try again later.',
});

export const otpLimiter = createLimiter({
  group: 'otp',
  windowMs: 2 * 60 * 1000,
  max: 5,
  message: 'Too many OTP attempts, please try again later.',
});

export const generalAuthLimiter = createLimiter({
  group: 'general-auth',
  windowMs: 60 * 1000,
  max: 100,
  message: 'Too many authentication requests, please try again later.',
});

export const sensitiveOpsLimiter = createLimiter({
  group: 'sensitive',
  windowMs: 60 * 1000,
  max: 5,
  message: 'Action limit reached. Please slow down.',
  useRedis: false,
});

export const createAdminLimiter = createLimiter({
  group: 'admin-create',
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many admin creation attempts from this IP, please try again after 15 minutes.',
});
