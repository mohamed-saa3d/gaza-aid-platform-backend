import { prisma } from '../../shared/database/prisma';
import { AppError } from '../../shared/errors/app-error';
import { settingsSelect } from './settings.constants';
import { pickLocalized, type ContentLocale } from '../../shared/middlewares/locale.middleware';
import type { UpdateSettingsInput } from './settings.types';

/**
 * Adds locale-resolved convenience fields on top of the raw AR/EN columns.
 *
 * The raw fields are untouched so the admin dashboard still round-trips exactly
 * what it saved, while `siteName`, `aboutUsText` and `contact*` are ready to
 * render in the language the public visitor selected.
 */
const withLocalizedFields = <
  T extends {
    siteNameAr?: string | null;
    siteNameEn?: string | null;
    aboutUsTextAr?: string | null;
    aboutUsTextEn?: string | null;
  },
>(
  settings: T,
  locale: ContentLocale,
) => ({
  ...settings,
  siteName: pickLocalized(locale, settings.siteNameAr, settings.siteNameEn),
  aboutUsText: pickLocalized(locale, settings.aboutUsTextAr, settings.aboutUsTextEn),
});

export const settingsService = {
  async getSettings(locale: ContentLocale = 'ar') {
    const settings = await prisma.platformSettings.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: settingsSelect,
    });

    if (!settings) {
      throw new AppError('Platform settings were not found', 404);
    }

    return withLocalizedFields(settings, locale);
  },

  async updateSettings(input: UpdateSettingsInput) {
    try {
      const existing = await prisma.platformSettings.findFirst({ orderBy: { updatedAt: 'desc' } });

      if (!existing) {
        throw new AppError('Platform settings were not found', 404);
      }

      return prisma.platformSettings.update({
        where: { id: existing.id },
        data: {
          ...(input.siteNameAr !== undefined ? { siteNameAr: input.siteNameAr.trim() } : {}),
          ...(input.siteNameEn !== undefined ? { siteNameEn: input.siteNameEn.trim() } : {}),
          ...(input.aboutUsTextAr !== undefined ? { aboutUsTextAr: input.aboutUsTextAr.trim() } : {}),
          ...(input.aboutUsTextEn !== undefined ? { aboutUsTextEn: input.aboutUsTextEn.trim() } : {}),
          ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl || null } : {}),
          ...(input.aboutUsImageUrl !== undefined ? { aboutUsImageUrl: input.aboutUsImageUrl || null } : {}),
          ...(input.contactPhone !== undefined ? { contactPhone: input.contactPhone || null } : {}),
          ...(input.contactEmail !== undefined ? { contactEmail: input.contactEmail || null } : {}),
          ...(input.totalBeneficiaries !== undefined ? { totalBeneficiaries: input.totalBeneficiaries } : {}),
          ...(input.foodBaskets !== undefined ? { foodBaskets: input.foodBaskets } : {}),
          ...(input.yearsOfGiving !== undefined ? { yearsOfGiving: input.yearsOfGiving } : {}),
        },
        select: settingsSelect,
      });
    } catch (error) {
      throw error;
    }
  },
};
