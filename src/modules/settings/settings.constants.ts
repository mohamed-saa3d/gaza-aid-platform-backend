import type { Prisma } from '@prisma/client';

export const settingsSelect = {
  id: true,
  siteNameAr: true,
  siteNameEn: true,
  aboutUsTextAr: true,
  aboutUsTextEn: true,
  logoUrl: true,
  aboutUsImageUrl: true,
  contactPhone: true,
  contactEmail: true,
  totalBeneficiaries: true,
  foodBaskets: true,
  yearsOfGiving: true,
  updatedAt: true,
} satisfies Prisma.PlatformSettingsSelect;
