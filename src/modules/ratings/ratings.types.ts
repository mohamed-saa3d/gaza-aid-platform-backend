import { z } from 'zod';

export const submitRatingSchema = z.object({
  body: z.object({
    value: z.number().int().min(1).max(5),
    comment: z.string().max(1000).optional(),
  }),
});

export type SubmitRatingInput = z.infer<typeof submitRatingSchema>['body'];
