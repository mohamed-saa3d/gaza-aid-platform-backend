import { Router } from 'express';
import { authenticateUser } from '../../shared/middleware/auth.middleware';
import { validateRequest } from '../../shared/middleware/validate.middleware';
import {
  changePassword,
  forgotPassword,
  login,
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
  verifyEmailSchema,
} from './auth.validation';

export const authRoutes = Router();

authRoutes.post('/register', validateRequest(registerSchema), register);
authRoutes.post('/login', validateRequest(loginSchema), login);
authRoutes.post('/verify-email', validateRequest(verifyEmailSchema), verifyEmail);
authRoutes.post('/forgot-password', validateRequest(forgotPasswordSchema), forgotPassword);
authRoutes.post('/reset-password', validateRequest(resetPasswordSchema), resetPassword);
authRoutes.post('/change-password', authenticateUser, validateRequest(changePasswordSchema), changePassword);
