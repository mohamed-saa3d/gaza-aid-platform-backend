import rateLimit from 'express-rate-limit';
import { env } from '../../config/env';
const RedisStore = require('rate-limit-redis');
import redisClient from '../../config/redis.config';

export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
  store: new RedisStore({ sendCommand: (...args: string[]) => redisClient.sendCommand(args) }),
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
  store: new RedisStore({ sendCommand: (...args: string[]) => redisClient.sendCommand(args) }),
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
  store: new RedisStore({ sendCommand: (...args: string[]) => redisClient.sendCommand(args) }),
});

export const loginLimiter = authRateLimiter;
export const otpLimiter = authRateLimiter;
