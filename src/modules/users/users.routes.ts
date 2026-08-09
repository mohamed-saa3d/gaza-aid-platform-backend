import { Router } from 'express';
import { authenticateUser } from '../../shared/middleware/auth.middleware';
import { validateRequest } from '../../shared/middleware/validate.middleware';
import {
  getProfile,
  getUserDonations,
  login,
  register,
  updateProfile,
} from './users.controller';
import { loginSchema, registerSchema, updateProfileSchema } from './users.validation';

export const usersRoutes = Router();

usersRoutes.post('/register', validateRequest(registerSchema), register);
usersRoutes.post('/login', validateRequest(loginSchema), login);
usersRoutes.get('/me', authenticateUser, getProfile);
usersRoutes.put('/me', authenticateUser, validateRequest(updateProfileSchema), updateProfile);
usersRoutes.get('/me/donations', authenticateUser, getUserDonations);
