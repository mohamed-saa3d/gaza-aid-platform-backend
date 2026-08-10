import { Router } from 'express';
import { authenticateUser } from '../../shared/middlewares/auth.middleware';
import { validateRequest } from '../../shared/middlewares/validate.middleware';
import { loginLimiter, otpLimiter } from '../../shared/middlewares/rate-limiter.middleware';
import {
  changePassword,
  forgotPassword,
  login,
  refreshToken,
  register,
  resetPassword,
  verifyEmail,
} from './auth.controller';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  verifyEmailSchema,
} from './auth.validation';

export const authRoutes = Router();

authRoutes.post('/register', otpLimiter, validateRequest(registerSchema), register);
authRoutes.post('/login', loginLimiter, validateRequest(loginSchema), login);
authRoutes.post('/refresh', refreshToken);
authRoutes.post('/verify-email', otpLimiter, validateRequest(verifyEmailSchema), verifyEmail);
authRoutes.post('/forgot-password', otpLimiter, validateRequest(forgotPasswordSchema), forgotPassword);
authRoutes.post('/reset-password', otpLimiter, validateRequest(resetPasswordSchema), resetPassword);
authRoutes.post('/change-password', authenticateUser, validateRequest(changePasswordSchema), changePassword);
