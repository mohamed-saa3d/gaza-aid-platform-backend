import { Router } from 'express';
import { createAdminLimiter, loginLimiter } from '../../shared/middlewares/rate-limiter.middleware';
import { requireAdmin, isRootAdmin } from '../../shared/authorization';
import { validateRequest } from '../../shared/middlewares/validate.middleware';
import {
  adminLogin,
  createAdmin,
  deleteAdmin,
  getAdminProfile,
  getAllAdmins,
  updateAdmin,
} from './admin.controller';
import { adminLoginSchema } from './admin.validation';

export const adminRoutes = Router();

adminRoutes.post('/login', loginLimiter, validateRequest(adminLoginSchema), adminLogin);
adminRoutes.get('/profile', requireAdmin, getAdminProfile);
adminRoutes.post('/', requireAdmin, isRootAdmin, createAdminLimiter, createAdmin);
adminRoutes.get('/', requireAdmin, getAllAdmins);
adminRoutes.put('/:id', requireAdmin, updateAdmin);
adminRoutes.delete('/:id', requireAdmin, deleteAdmin);
