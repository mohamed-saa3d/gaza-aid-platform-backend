import { Router } from 'express';
import { requireAdmin } from '../../shared/authorization';
import { validateRequest } from '../../shared/middlewares/validate.middleware';
import {
  initializeDonation,
  handlePaymentWebhook,
  getDonations,
  getProjectDonations,
} from './donations.controller';
import { initializeDonationSchema, webhookDonationSchema } from './donations.validation';

export const donationsRoutes = Router();

donationsRoutes.post('/initialize', validateRequest(initializeDonationSchema), initializeDonation);
donationsRoutes.post('/webhook', validateRequest(webhookDonationSchema), handlePaymentWebhook);
donationsRoutes.get('/', requireAdmin, getDonations);
donationsRoutes.get('/project/:projectId', getProjectDonations);
