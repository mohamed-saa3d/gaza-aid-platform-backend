import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many login attempts, please try again later',
    });
  },
});

export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many OTP requests, please try again later',
    });
  },
});
