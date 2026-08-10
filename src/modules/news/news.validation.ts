import { z } from 'zod';

const newsBase = {
  titleAr: z.string().trim().min(2, 'Arabic title is required'),
  titleEn: z.string().trim().min(2, 'English title is required'),
  descriptionAr: z.string().trim().min(10, 'Arabic description is required'),
  descriptionEn: z.string().trim().min(10, 'English description is required'),
  image: z.string().trim().url('Invalid image URL'),
  detailsUrl: z.string().trim().url('Invalid details URL').optional(),
  isUrgent: z.boolean().optional(),
};

export const createNewsSchema = z.object({
  body: z.object({
    ...newsBase,
  }),
});

export const updateNewsSchema = z.object({
  body: z.object({
    ...newsBase,
  }).partial().refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  }),
});
