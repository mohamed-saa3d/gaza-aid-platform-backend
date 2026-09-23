import { Prisma } from '@prisma/client';
import { prisma } from '../../shared/database/prisma';
import { AppError } from '../../shared/errors/app-error';
import { isPrismaKnownRequestError } from '../../shared/utils/prisma-error';
import { newsSelect } from './news.constants';
import { cloudinaryService } from '../../shared/services/cloudinary.service';
import { pickLocalized, type ContentLocale } from '../../shared/middlewares/locale.middleware';
import type { CreateNewsInput, UpdateNewsInput } from './news.types';

/** Adds locale-resolved `title`/`description` alongside the raw AR/EN fields. */
const withLocalizedFields = <
  T extends {
    titleAr?: string | null;
    titleEn?: string | null;
    descriptionAr?: string | null;
    descriptionEn?: string | null;
  },
>(
  item: T,
  locale: ContentLocale,
) => ({
  ...item,
  title: pickLocalized(locale, item.titleAr, item.titleEn),
  description: pickLocalized(locale, item.descriptionAr, item.descriptionEn),
});

export const newsService = {
  async getNewsList(page = 1, limit = 10, locale: ContentLocale = 'ar') {
    const [total, news] = await Promise.all([
      prisma.news.count(),
      prisma.news.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: newsSelect,
      }),
    ]);

    return { data: news.map((item) => withLocalizedFields(item, locale)), total, page, limit };
  },

  async getNewsById(id: string, locale: ContentLocale = 'ar') {
    const news = await prisma.news.findUnique({
      where: { id },
      select: newsSelect,
    });

    if (!news) {
      throw new AppError('News item was not found', 404);
    }

    return withLocalizedFields(news, locale);
  },

  async createNews(input: CreateNewsInput) {
    return prisma.news.create({
      data: {
        titleAr: input.titleAr.trim(),
        titleEn: input.titleEn.trim(),
        descriptionAr: input.descriptionAr.trim(),
        descriptionEn: input.descriptionEn.trim(),
        imageUrl: input.imageUrl?.trim() || 'https://via.placeholder.com/600x400?text=No+Image',
        imgPublicId: (input as any).imgPublicId || null,
        detailsUrl: input.detailsUrl?.trim() || null,
        isUrgent: input.isUrgent ?? false,
      } as any,
      select: newsSelect,
    });
  },

  async updateNews(input: UpdateNewsInput) {
    try {
      return await prisma.news.update({
        where: { id: input.id },
        data: {
          ...(input.titleAr !== undefined ? { titleAr: input.titleAr.trim() } : {}),
          ...(input.titleEn !== undefined ? { titleEn: input.titleEn.trim() } : {}),
          ...(input.descriptionAr !== undefined ? { descriptionAr: input.descriptionAr.trim() } : {}),
          ...(input.descriptionEn !== undefined ? { descriptionEn: input.descriptionEn.trim() } : {}),
          ...(input.imageUrl !== undefined ? { imageUrl: (input.imageUrl as string).trim() } : {}),
          ...(input.imgPublicId !== undefined ? { imgPublicId: (input as any).imgPublicId } : {}),
          ...(input.detailsUrl !== undefined
            ? { detailsUrl: input.detailsUrl?.trim() || null }
            : {}),
          ...(input.isUrgent !== undefined ? { isUrgent: input.isUrgent } : {}),
        } as any,
        select: newsSelect,
      });
    } catch (error) {
      if (isPrismaKnownRequestError(error, 'P2025')) {
        throw new AppError('News item was not found', 404);
      }

      throw error;
    }
  },

  async deleteNews(id: string) {
    try {
      // fetch public id to delete remote image
      const existing = await prisma.news.findUnique({ where: { id }, select: { imgPublicId: true } as any });
      await prisma.news.delete({ where: { id } });

      if (existing && (existing as any).imgPublicId) {
        try {
          await cloudinaryService.deleteImage((existing as any).imgPublicId);
        } catch (err) {
          // log and continue
          // eslint-disable-next-line no-console
          console.warn('Failed to delete Cloudinary image for news', id, err);
        }
      }
    } catch (error) {
      if (isPrismaKnownRequestError(error, 'P2025')) {
        throw new AppError('News item was not found', 404);
      }

      throw error;
    }
  },
};
