import type { Prisma } from '@prisma/client';

export const liveStreamSelect = {
  id: true,
  titleAr: true,
  titleEn: true,
  youtubeUrl: true,
  isActive: true,
  createdAt: true,
} satisfies Prisma.LiveStreamSelect;
