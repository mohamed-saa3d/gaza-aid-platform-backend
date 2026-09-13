import { Router } from 'express';
import { requireUser } from '../../shared/authorization';
import { validateRequest } from '../../shared/middlewares/validate.middleware';
import { paymentsController } from './payments.controller';
import { createCheckoutValidation, webhookPaymentValidation } from './payments.validation';
import { verifyWebhookSignature } from '../../shared/middlewares/webhook-signature.middleware';

export const paymentsRoutes = Router();

paymentsRoutes.post('/checkout', requireUser, validateRequest(createCheckoutValidation), paymentsController.createCheckoutSession);
paymentsRoutes.post('/webhook', verifyWebhookSignature, validateRequest(webhookPaymentValidation), paymentsController.handleGatewayWebhook);
