import { Router } from 'express';
import { createAdminLimiter, loginLimiter } from '../../shared/middlewares/rate-limiter.middleware';
import { requireAdmin, requireSuperAdmin } from '../../shared/authorization';
import { validateRequest } from '../../shared/middlewares/validate.middleware';
import {
  adminLogin,
  logoutAdmin,
  refreshAdminToken,
  createAdmin,
  deleteAdmin,
  getAdminProfile,
  getAllAdmins,
  updateAdmin,
} from './admin.controller';
import { adminLoginSchema, createAdminSchema, updateAdminSchema } from './admin.validation';
import { refreshTokenSchema } from '../auth/auth.validation';

export const adminRoutes = Router();

adminRoutes.post('/login', loginLimiter, validateRequest(adminLoginSchema), adminLogin);
adminRoutes.post('/refresh', loginLimiter, validateRequest(refreshTokenSchema), refreshAdminToken);
adminRoutes.post('/logout', loginLimiter, logoutAdmin);
adminRoutes.get('/profile', requireAdmin, getAdminProfile);
adminRoutes.post('/', requireSuperAdmin, createAdminLimiter, validateRequest(createAdminSchema), createAdmin);
adminRoutes.get('/', requireAdmin, getAllAdmins);
adminRoutes.put('/:id', requireSuperAdmin, validateRequest(updateAdminSchema), updateAdmin);
adminRoutes.delete('/:id', requireSuperAdmin, deleteAdmin);
