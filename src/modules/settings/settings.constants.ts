import type { Prisma } from '@prisma/client';

export const settingsSelect = {
  id: true,
  aboutUsTextAr: true,
  aboutUsTextEn: true,
  contactPhone: true,
  contactEmail: true,
  totalBeneficiaries: true,
  foodBaskets: true,
  yearsOfGiving: true,
  updatedAt: true,
} satisfies Prisma.PlatformSettingsSelect;
