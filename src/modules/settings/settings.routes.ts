import { Router } from 'express';
import { requireAdmin } from '../../shared/authorization';
import { validateRequest } from '../../shared/middlewares/validate.middleware';
import { uploadSingleImage } from '../../shared/middlewares/upload.middleware';
import {
  getSettings,
  updateSettings,
  uploadSiteLogo,
} from './settings.controller';
import { useCache } from '../../shared/middlewares/cache.middleware';
import { updateSettingsSchema } from './settings.validation';

export const settingsRoutes = Router();

settingsRoutes.get('/', useCache('settings', 3600), getSettings);
settingsRoutes.put('/', requireAdmin, validateRequest(updateSettingsSchema), updateSettings);
settingsRoutes.post('/logo', requireAdmin, uploadSingleImage('logo'), uploadSiteLogo);
