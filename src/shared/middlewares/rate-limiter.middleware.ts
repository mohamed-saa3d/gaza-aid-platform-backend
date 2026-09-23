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
  /**
   * Every limiter gets its own Redis key namespace.
   *
   * `rate-limit-redis` defaults every instance to the shared `rl:` prefix and the
   * Redis keys are namespaced by window*length*, not by limiter instance. Two
   * limiters sharing that prefix therefore overwrite each other's TTL: an earlier
   * 15-minute bucket was being deleted outright by any limiter whose window was
   * shorter. A per-limiter prefix keeps the budgets completely independent.
   */
  private readonly redisStore: Store;

  constructor(prefix: string) {
    this.redisStore = new RedisStore({
      prefix,
      sendCommand: async (...args: string[]) => {
        if (!redisClient.isReady) {
          throw new Error('Redis is unavailable');
        }

        return redisClient.sendCommand(args);
      },
    });
  }

  private readonly memoryStore = new MemoryStore();

  init(options: Options): void {
    this.memoryStore.init(options);

    if (!redisClient.isReady) {
      // Wait for Redis to be ready before initializing the Redis-backed store.
      redisClient.once('ready', () => {
        void Promise.resolve(this.redisStore.init?.(options)).catch((error: unknown) => {
          logger.warn('[RateLimiter] Redis store delayed init failed', error);
        });
      });
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

const developmentMultiplier = 1;

type LimiterKind = 'read' | 'write';

const createLimiter = ({
  group,
  windowMs,
  max,
  message,
  useRedis = true,
  kind = 'write',
}: {
  group: string;
  windowMs: number;
  max: number;
  message: string;
  useRedis?: boolean;
  /**
   * `read` buckets every safe (GET/HEAD/OPTIONS) request from one client IP,
   * `write` buckets only state-changing methods. Splitting the two is the whole
   * point: an anonymous visitor browsing the site only ever spends read budget,
   * so normal navigation can never exhaust the budget that protects mutations.
   */
  kind?: LimiterKind;
}) =>
  rateLimit({
    windowMs,
    max: max * developmentMultiplier,
    standardHeaders: true,
    legacyHeaders: false,
    // Only count the requests this limiter is responsible for. Returning
    // `undefined` makes express-rate-limit skip the request entirely instead of
    // consuming budget, which is what keeps read traffic out of the write bucket.
    skip: (request) => {
      const isRead = request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS';
      return kind === 'read' ? !isRead : isRead;
    },
    keyGenerator: (request) => {
      const clientIp = ipKeyGenerator(request.ip ?? 'unknown');
      const routeGroup = `${request.method}:${request.baseUrl || '/'}`;

      if (kind === 'read') {
        return `read:${routeGroup}:${clientIp}`;
      }

      return `write:${group}:${routeGroup}:${clientIp}`;
    },
    message: {
      success: false,
      message,
    },
    ...(useRedis ? { store: new ResilientRedisStore(`rl:${kind}:${group}:`) } : {}),
  });

/**
 * Policy applied to every /api/v1 route.
 *
 * Read and write are separate buckets with separate budgets:
 *  - reads get a generous budget (browsing one page already fires several public
 *    GETs: settings, categories, projects, ...), keyed per method+route so a
 *    category listing can never exhaust the settings bucket;
 *  - writes keep a tight budget, because that is what abuse actually looks like.
 *
 * Auth routes are exempted in `app.ts` and protected by their own stricter
 * limiters instead (login/register/otp).
 */
export const publicReadLimiter = createLimiter({
  group: 'public-read',
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_READ_REQUESTS,
  message: 'Too many requests, please try again later.',
  kind: 'read',
});

export const mutationLimiter = createLimiter({
  group: 'mutation',
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many requests, please try again later.',
  kind: 'write',
});

/** Applies both policies; each one only counts the methods it owns. */
export const globalRateLimiter = (
  request: Parameters<typeof publicReadLimiter>[0],
  response: Parameters<typeof publicReadLimiter>[1],
  next: Parameters<typeof publicReadLimiter>[2],
): void => {
  publicReadLimiter(request, response, (readError?: unknown) => {
    if (readError) {
      next(readError);
      return;
    }

    mutationLimiter(request, response, next);
  });
};

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

/**
 * Platform-rating submissions.
 *
 * Generous enough for a legitimate visitor changing their mind, tight enough that
 * a script cannot inflate the aggregate. Keyed per visitor (see
 * `visitorIdentityMiddleware`), so one abusive client cannot exhaust the budget
 * for everyone else behind the same NAT/proxy.
 */
export const ratingSubmitLimiter = createLimiter({
  group: 'rating-submit',
  windowMs: 10 * 60 * 1000,
  max: 12,
  message: 'Too many rating submissions, please try again later.',
});

export const createAdminLimiter = createLimiter({
  group: 'admin-create',
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many admin creation attempts from this IP, please try again after 15 minutes.',
});
