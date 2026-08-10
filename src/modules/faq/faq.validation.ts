import { z } from 'zod';

const faqBase = {
  questionAr: z.string().trim().min(2, 'Arabic question is required'),
  questionEn: z.string().trim().min(2, 'English question is required'),
  answerAr: z.string().trim().min(5, 'Arabic answer is required'),
  answerEn: z.string().trim().min(5, 'English answer is required'),
  isActive: z.boolean().optional(),
};

export const createFaqSchema = z.object({
  body: z.object({
    ...faqBase,
  }),
});

export const updateFaqSchema = z.object({
  body: z.object({
    ...faqBase,
  }).partial().refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  }),
});
