import { Router } from 'express';
import { createAdminLimiter, loginLimiter } from '../../shared/middlewares/rate-limiter.middleware';
import { requireAdmin, requireSuperAdmin } from '../../shared/authorization';
import { validateRequest } from '../../shared/middlewares/validate.middleware';
import {
  adminLogin,
  createAdmin,
  deleteAdmin,
  getAdminProfile,
  getAllAdmins,
  updateAdmin,
} from './admin.controller';
import { adminLoginSchema, createAdminSchema, updateAdminSchema } from './admin.validation';

export const adminRoutes = Router();

adminRoutes.post('/login', loginLimiter, validateRequest(adminLoginSchema), adminLogin);
adminRoutes.get('/profile', requireAdmin, getAdminProfile);
adminRoutes.post('/', requireSuperAdmin, createAdminLimiter, validateRequest(createAdminSchema), createAdmin);
adminRoutes.get('/', requireAdmin, getAllAdmins);
adminRoutes.put('/:id', requireSuperAdmin, validateRequest(updateAdminSchema), updateAdmin);
adminRoutes.delete('/:id', requireSuperAdmin, deleteAdmin);
