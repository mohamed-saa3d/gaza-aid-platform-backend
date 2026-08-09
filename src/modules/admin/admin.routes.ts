import { Router } from 'express';
import {
  createAdmin,
  deleteAdmin,
  getAllAdmins,
  updateAdmin,
} from './admin.controller';

export const adminRoutes = Router();

adminRoutes.post('/', createAdmin);
adminRoutes.get('/', getAllAdmins);
adminRoutes.patch('/:id', updateAdmin);
adminRoutes.delete('/:id', deleteAdmin);
