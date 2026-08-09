import { Router } from 'express';
import { AdminRole } from '@prisma/client';
import {
  createAdmin,
  deleteAdmin,
  getAllAdmins,
  loginAdmin,
  updateAdmin,
} from '../controllers/admin.controller';
import { requireAdminRole, verifyAdminToken } from '../middlewares/adminAuth';

const router = Router();

router.post('/login', loginAdmin);

router.use(verifyAdminToken);
router.use(requireAdminRole(AdminRole.ADMIN));

router.post('/', createAdmin);
router.get('/', getAllAdmins);
router.patch('/:id', updateAdmin);
router.delete('/:id', deleteAdmin);

export default router;
