import { type z } from 'zod';
import { initializeDonationSchema, webhookDonationSchema } from './donations.validation';

export type InitializeDonationInput = z.infer<typeof initializeDonationSchema>;
export type WebhookDonationInput = z.infer<typeof webhookDonationSchema>;
