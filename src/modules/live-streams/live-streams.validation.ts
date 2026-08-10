import { z } from 'zod';

const liveStreamBase = {
  titleAr: z.string().trim().min(2, 'Arabic title is required'),
  titleEn: z.string().trim().min(2, 'English title is required'),
  youtubeUrl: z.string().trim().url('Invalid YouTube URL'),
  isActive: z.boolean().optional(),
};

export const createLiveStreamSchema = z.object({
  body: z.object({
    ...liveStreamBase,
  }),
});

export const updateLiveStreamSchema = z.object({
  body: z.object({
    ...liveStreamBase,
  }).partial().refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  }),
});
