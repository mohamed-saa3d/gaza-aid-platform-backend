import { Router } from 'express';
import { requireUser } from '../../shared/authorization';
import { validateRequest } from '../../shared/middlewares/validate.middleware';
import { paymentsController } from './payments.controller';
import { createCheckoutValidation, webhookPaymentValidation } from './payments.validation';

export const paymentsRoutes = Router();

paymentsRoutes.post('/checkout', requireUser, validateRequest(createCheckoutValidation), paymentsController.createCheckoutSession);
paymentsRoutes.post('/webhook', validateRequest(webhookPaymentValidation), paymentsController.handleGatewayWebhook);
