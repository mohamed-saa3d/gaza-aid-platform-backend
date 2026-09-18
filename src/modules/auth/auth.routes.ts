import { Router } from 'express';
import { requireAuth } from '../../shared/authorization';
import { validateRequest } from '../../shared/middlewares/validate.middleware';
import {
  generalAuthLimiter,
  loginLimiter,
  otpLimiter,
  registerLimiter,
} from '../../shared/middlewares/rate-limiter.middleware';
import {
  changePassword,
  forgotPassword,
  login,
  logout,
  refreshToken,
  register,
  resendOtp,
  resetPassword,
  verifyEmail,
} from './auth.controller';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resendOtpSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  verifyEmailSchema,
} from './auth.validation';

export const authRoutes = Router();

authRoutes.post('/register', registerLimiter, validateRequest(registerSchema), register);
authRoutes.post('/login', loginLimiter, validateRequest(loginSchema), login);
authRoutes.post('/refresh', generalAuthLimiter, validateRequest(refreshTokenSchema), refreshToken);
authRoutes.post('/logout', generalAuthLimiter, logout);
authRoutes.post('/verify-email', otpLimiter, validateRequest(verifyEmailSchema), verifyEmail);
authRoutes.post('/resend-otp', otpLimiter, validateRequest(resendOtpSchema), resendOtp);
authRoutes.post('/forgot-password', otpLimiter, validateRequest(forgotPasswordSchema), forgotPassword);
authRoutes.post('/reset-password', otpLimiter, validateRequest(resetPasswordSchema), resetPassword);
authRoutes.post('/change-password', requireAuth, generalAuthLimiter, validateRequest(changePasswordSchema), changePassword);
