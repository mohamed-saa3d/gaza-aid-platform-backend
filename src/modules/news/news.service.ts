import { Prisma } from '@prisma/client';
import { prisma } from '../../shared/database/prisma';
import { AppError } from '../../shared/errors/app-error';
import { newsSelect } from './news.constants';
import type { CreateNewsInput, UpdateNewsInput } from './news.types';

export const newsService = {
  async getNewsList(page = 1, limit = 10) {
    const [total, news] = await prisma.$transaction([
      prisma.news.count(),
      prisma.news.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: newsSelect,
      }),
    ]);

    return { data: news, total, page, limit };
  },

  async getNewsById(id: string) {
    const news = await prisma.news.findUnique({
      where: { id },
      select: newsSelect,
    });

    if (!news) {
      throw new AppError('News item was not found', 404);
    }

    return news;
  },

  async createNews(input: CreateNewsInput) {
    return prisma.news.create({
      data: {
        titleAr: input.titleAr.trim(),
        titleEn: input.titleEn.trim(),
        descriptionAr: input.descriptionAr.trim(),
        descriptionEn: input.descriptionEn.trim(),
        imageUrl: input.imageUrl.trim(),
        detailsUrl: input.detailsUrl?.trim() || null,
        isUrgent: input.isUrgent ?? false,
      },
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
          ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl.trim() } : {}),
          ...(input.detailsUrl !== undefined
            ? { detailsUrl: input.detailsUrl?.trim() || null }
            : {}),
          ...(input.isUrgent !== undefined ? { isUrgent: input.isUrgent } : {}),
        },
        select: newsSelect,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new AppError('News item was not found', 404);
      }

      throw error;
    }
  },

  async deleteNews(id: string) {
    try {
      await prisma.news.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new AppError('News item was not found', 404);
      }

      throw error;
    }
  },
};
