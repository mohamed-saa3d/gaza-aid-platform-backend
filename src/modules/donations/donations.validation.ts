import { z } from 'zod';

export const initializeDonationSchema = z.object({
  body: z.object({
    amount: z.number().positive({ message: 'Amount must be greater than 0' }),
    currency: z.string().min(1, { message: 'Currency is required' }),
    projectId: z.string().regex(/^[a-f\d]{24}$/i, { message: 'Invalid project ID' }),
    userId: z.string().regex(/^[a-f\d]{24}$/i, { message: 'Invalid user ID' }).optional(),
  }),
});

export const webhookDonationSchema = z.object({
  body: z.object({
    donationId: z.string().regex(/^[a-f\d]{24}$/i, { message: 'Invalid donation ID' }),
    transactionId: z.string().min(1, { message: 'Transaction ID is required' }),
  }),
});

