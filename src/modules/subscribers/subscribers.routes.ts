import { Router } from 'express';
import { requireAdmin } from '../../shared/authorization';
import { validateRequest } from '../../shared/middlewares/validate.middleware';
import {
  broadcastMessage,
  getAllSubscribers,
  getSubscribersCount,
  subscribe,
} from './subscribers.controller';
import { broadcastMessageSchema, subscribeSchema } from './subscribers.validation';

export const subscriberRoutes = Router();

subscriberRoutes.post('/', validateRequest(subscribeSchema), subscribe);
subscriberRoutes.get('/count', getSubscribersCount);
subscriberRoutes.get('/', requireAdmin, getAllSubscribers);
subscriberRoutes.post(
  '/broadcast',
  requireAdmin,
  validateRequest(broadcastMessageSchema),
  broadcastMessage,
);

export const subscribersRoutes = subscriberRoutes;
