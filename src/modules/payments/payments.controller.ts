import type { Request, RequestHandler } from 'express';
import { requireUser } from '../../shared/authorization';
import { validateRequest } from '../../shared/middlewares/validate.middleware';
import { paymentsService } from './payments.service';
import { createCheckoutValidation, webhookPaymentValidation } from './payments.validation';

const getAuthenticatedUserId = (req: Request): string => {
  if (!req.user?.id) {
    throw new Error('Authentication is required');
  }

  return req.user.id;
};

export const createCheckoutSession: RequestHandler = async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const { amount, currency, purpose, referenceId } = req.body as {
      amount: number;
      currency?: string;
      purpose: 'WALLET_FUNDING' | 'DIRECT_DONATION';
      referenceId?: string;
    };

    const result = await paymentsService.createCheckoutSession(userId, {
      amount,
      currency,
      purpose,
      referenceId,
    });

    res.status(201).json({
      success: true,
      message: 'Checkout session created successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const handleGatewayWebhook: RequestHandler = async (req, res, next) => {
  try {
    const { paymentIntentId, gatewayStatus } = req.body as {
      paymentIntentId: string;
      gatewayStatus: 'SUCCESS' | 'FAILED';
    };

    const result = await paymentsService.handleGatewayWebhook({ paymentIntentId, gatewayStatus });

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

export const paymentsController = {
  createCheckoutSession,
  handleGatewayWebhook,
};
