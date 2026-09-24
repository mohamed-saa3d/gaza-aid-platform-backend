import type { Prisma } from '@prisma/client';

export const projectSelect = {
  id: true,
  titleAr: true,
  titleEn: true,
  descriptionAr: true,
  descriptionEn: true,
  imgUrl: true,
  targetAmount: true,
  collectedAmount: true,
  beneficiariesCount: true,
  status: true,
  isUrgent: true,
  category: {
    select: {
      id: true,
      nameAr: true,
      nameEn: true,
    },
  },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProjectSelect;
