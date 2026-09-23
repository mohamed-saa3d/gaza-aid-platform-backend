import { Router } from 'express';
import { loginLimiter } from '../../shared/middlewares/rate-limiter.middleware';
import { requireAdmin } from '../../shared/authorization';
import { validateRequest } from '../../shared/middlewares/validate.middleware';
import {
  adminLogin,
  logoutAdmin,
  refreshAdminToken,
  getAdminProfile,
} from './admin.controller';
import { adminLoginSchema } from './admin.validation';
import { refreshTokenSchema } from '../auth/auth.validation';

/**
 * Admin authentication + the authenticated admin's own identity.
 *
 * Admin Management (create/update/delete/list other admins) was removed with the
 * single-admin architecture: one ADMIN account is provisioned from the
 * environment at bootstrap. Auth itself is unchanged.
 */
export const adminRoutes = Router();

adminRoutes.post('/login', loginLimiter, validateRequest(adminLoginSchema), adminLogin);
adminRoutes.post('/refresh', loginLimiter, validateRequest(refreshTokenSchema), refreshAdminToken);
adminRoutes.post('/logout', loginLimiter, logoutAdmin);
adminRoutes.get('/profile', requireAdmin, getAdminProfile);
