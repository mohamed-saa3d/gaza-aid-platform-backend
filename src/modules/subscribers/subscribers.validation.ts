import { z } from 'zod';

export const subscribeSchema = z.object({
  body: z.object({
    email: z.email('Invalid email address').trim().toLowerCase(),
  }),
});

export const broadcastMessageSchema = z.object({
  body: z.object({
    subject: z.string().trim().min(1, 'Subject is required'),
    message: z.string().trim().min(1, 'Message is required'),
  }),
});
