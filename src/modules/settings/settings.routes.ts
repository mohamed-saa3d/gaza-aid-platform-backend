import { Router } from 'express';
import { requireAdmin } from '../../shared/authorization';
import { validateRequest } from '../../shared/middlewares/validate.middleware';
import {
  getSettings,
  updateSettings,
} from './settings.controller';
import { updateSettingsSchema } from './settings.validation';

export const settingsRoutes = Router();

// Deliberately NOT cached. Settings drive the public contact details — the
// values an Admin edits and immediately expects to see publicly. A TTL cache
// here only ever risked serving a stale phone/email to visitors after a save, so
// the single lightweight query runs per request instead. Cache invalidation is
// therefore not a correctness concern for settings.
settingsRoutes.get('/', getSettings);
settingsRoutes.put('/', requireAdmin, validateRequest(updateSettingsSchema), updateSettings);
