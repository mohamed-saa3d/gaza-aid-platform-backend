import { Router } from 'express';
import { authenticateUser } from '../../shared/middleware/auth.middleware';
import { validateRequest } from '../../shared/middleware/validate.middleware';
import { getProfile, getUserDonations, updateProfile } from './users.controller';
import { updateProfileSchema } from './users.validation';

export const usersRoutes = Router();

usersRoutes.get('/me', authenticateUser, getProfile);
usersRoutes.put('/me', authenticateUser, validateRequest(updateProfileSchema), updateProfile);
usersRoutes.get('/me/donations', authenticateUser, getUserDonations);
