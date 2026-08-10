import { Router } from 'express';
import { requireUser } from '../../shared/authorization';
import { validateRequest } from '../../shared/middlewares/validate.middleware';
import { getProfile, getUserDonations, updateProfile } from './users.controller';
import { updateProfileSchema } from './users.validation';

export const usersRoutes = Router();

usersRoutes.get('/me', requireUser, getProfile);
usersRoutes.put('/me', requireUser, validateRequest(updateProfileSchema), updateProfile);
usersRoutes.get('/me/donations', requireUser, getUserDonations);
