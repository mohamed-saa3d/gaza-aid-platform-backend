import { z } from 'zod';

export const createCheckoutSchema = z.object({
  body: z.object({
    amount: z.number().int().positive({ message: 'Amount must be a positive integer in minor units' }),
    currency: z.string().min(1, { message: 'Currency is required' }).optional(),
    purpose: z.enum(['WALLET_FUNDING', 'DIRECT_DONATION']),
    referenceId: z.string().optional(),
  }),
});

export const webhookPaymentSchema = z.object({
  body: z.object({
    paymentIntentId: z.string().regex(/^[a-f\d]{24}$/i, { message: 'Invalid payment intent ID' }),
    gatewayStatus: z.enum(['SUCCESS', 'FAILED']),
  }),
});

export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>['body'];
export type WebhookPaymentInput = z.infer<typeof webhookPaymentSchema>['body'];
