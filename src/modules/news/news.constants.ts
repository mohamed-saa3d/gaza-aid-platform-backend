import type { Prisma } from '@prisma/client';

export const newsSelect = {
  id: true,
  titleAr: true,
  titleEn: true,
  descriptionAr: true,
  descriptionEn: true,
  imageUrl: true,
  detailsUrl: true,
  isUrgent: true,
  createdAt: true,
} satisfies Prisma.NewsSelect;
