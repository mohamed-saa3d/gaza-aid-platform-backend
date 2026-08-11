import { Router } from 'express';
import { requireAdmin, requireUser } from '../../shared/authorization';
import { validateRequest } from '../../shared/middlewares/validate.middleware';
import {
  changePassword,
  getAllUsers,
  getProfile,
  getUserDonations,
  softDeleteAccount,
  updateProfile,
} from './users.controller';
import { changePasswordSchema, updateProfileSchema } from './users.validation';

export const usersRoutes = Router();

usersRoutes.get('/profile', requireUser, getProfile);
usersRoutes.patch('/profile', requireUser, validateRequest(updateProfileSchema), updateProfile);
usersRoutes.post('/change-password', requireUser, validateRequest(changePasswordSchema), changePassword);
usersRoutes.delete('/account', requireUser, softDeleteAccount);
usersRoutes.get('/admin/all', requireAdmin, getAllUsers);
usersRoutes.get('/me/donations', requireUser, getUserDonations);
