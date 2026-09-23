import { z } from 'zod';
import { canEmbedYouTubeUrl } from '../../shared/utils/youtube';

/**
 * Requires a YouTube link that resolves to a real, embeddable video.
 * `z.string().url()` alone would let `https://www.youtube.com/` through, which
 * then saved an active stream that could never render on the public site.
 */
const youtubeUrlSchema = z
  .string()
  .trim()
  .url('Invalid YouTube URL')
  .refine(canEmbedYouTubeUrl, {
    message: 'YouTube URL must point to a video (watch, live, or youtu.be link)',
  });

const liveStreamBase = {
  titleAr: z.string().trim().min(2, 'Arabic title is required'),
  titleEn: z.string().trim().min(2, 'English title is required'),
  youtubeUrl: youtubeUrlSchema,
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
