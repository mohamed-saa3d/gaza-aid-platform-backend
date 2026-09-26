import { prisma } from '../../shared/database/prisma';
import { AppError } from '../../shared/errors/app-error';
import { settingsSelect } from './settings.constants';
import { pickLocalized, type ContentLocale } from '../../shared/middlewares/locale.middleware';
import type { UpdateSettingsInput } from './settings.types';

/**
 * Adds locale-resolved convenience fields on top of the raw AR/EN columns.
 *
 * The raw fields are untouched so the admin dashboard still round-trips exactly
 * what it saved, while `aboutUsText` is ready to render in the language the
 * public visitor selected. The site NAME is intentionally absent: it is static,
 * localized frontend branding (`t.branding.siteName`), not database data.
 */
const withLocalizedFields = <
  T extends {
    aboutUsTextAr?: string | null;
    aboutUsTextEn?: string | null;
  },
>(
  settings: T,
  locale: ContentLocale,
) => ({
  ...settings,
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
          ...(input.aboutUsTextAr !== undefined ? { aboutUsTextAr: input.aboutUsTextAr.trim() } : {}),
          ...(input.aboutUsTextEn !== undefined ? { aboutUsTextEn: input.aboutUsTextEn.trim() } : {}),
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
