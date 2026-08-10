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
import {
  createFaqSchema,
  updateFaqSchema,
} from './faq.validation';

export const faqRoutes = Router();

faqRoutes.get('/', getFaqs);
faqRoutes.get('/:id', getFaq);
faqRoutes.post('/', requireAdmin, validateRequest(createFaqSchema), createFaq);
faqRoutes.put('/:id', requireAdmin, validateRequest(updateFaqSchema), updateFaq);
faqRoutes.delete('/:id', requireAdmin, deleteFaq);
