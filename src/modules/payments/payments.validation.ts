import { createCheckoutSchema, webhookPaymentSchema } from './payments.types';

export const createCheckoutValidation = createCheckoutSchema;
export const webhookPaymentValidation = webhookPaymentSchema;
