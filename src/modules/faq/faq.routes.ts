import { Router } from 'express';
import { requireAdmin } from '../../shared/authorization';
import { validateRequest } from '../../shared/middlewares/validate.middleware';
import {
  createFaq,
  deleteFaq,
  getFaq,
  getFaqs,
  updateFaq,
} from './faq.controller';
import { useCache } from '../../shared/middlewares/cache.middleware';
import {
  createFaqSchema,
  updateFaqSchema,
} from './faq.validation';

export const faqRoutes = Router();

faqRoutes.get('/', useCache('faq', 3600), getFaqs);
faqRoutes.get('/:id', useCache('faq', 3600), getFaq);
faqRoutes.post('/', requireAdmin, validateRequest(createFaqSchema), createFaq);
faqRoutes.put('/:id', requireAdmin, validateRequest(updateFaqSchema), updateFaq);
faqRoutes.delete('/:id', requireAdmin, deleteFaq);
