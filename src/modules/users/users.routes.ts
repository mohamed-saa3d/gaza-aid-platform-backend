import { Router } from 'express';
import { requireAdmin, requireUser } from '../../shared/authorization';
import { uploadSingleImage } from '../../shared/middlewares/upload.middleware';
import { validateRequest } from '../../shared/middlewares/validate.middleware';
import {
  changePassword,
  getAllUsers,
  getProfile,
  getUserDonations,
  softDeleteAccount,
  updateProfile,
  updateUserAvatar,
} from './users.controller';
import { changePasswordSchema, updateProfileSchema } from './users.validation';

export const usersRoutes = Router();

usersRoutes.get('/profile', requireUser, getProfile);
usersRoutes.patch('/profile', requireUser, validateRequest(updateProfileSchema), updateProfile);
usersRoutes.patch('/me/avatar', requireUser, uploadSingleImage('avatar'), updateUserAvatar);
usersRoutes.post('/change-password', requireUser, validateRequest(changePasswordSchema), changePassword);
usersRoutes.delete('/account', requireUser, softDeleteAccount);
usersRoutes.get('/admin/all', requireAdmin, getAllUsers);
usersRoutes.get('/me/donations', requireUser, getUserDonations);
