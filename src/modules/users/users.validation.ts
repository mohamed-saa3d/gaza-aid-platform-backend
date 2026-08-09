import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').optional(),
    image: z.string().trim().url('Invalid image URL').nullable().optional(),
  }),
});
