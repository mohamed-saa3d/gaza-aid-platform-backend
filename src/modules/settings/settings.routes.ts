import { Router } from 'express';
import { requireAdmin } from '../../shared/authorization';
import { validateRequest } from '../../shared/middlewares/validate.middleware';
import {
  getSettings,
  updateSettings,
} from './settings.controller';
import { updateSettingsSchema } from './settings.validation';

export const settingsRoutes = Router();

settingsRoutes.get('/', getSettings);
settingsRoutes.put('/', requireAdmin, validateRequest(updateSettingsSchema), updateSettings);
