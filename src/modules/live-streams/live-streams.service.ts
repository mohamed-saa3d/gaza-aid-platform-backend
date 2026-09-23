import { Prisma } from '@prisma/client';
import { prisma } from '../../shared/database/prisma';
import { AppError } from '../../shared/errors/app-error';
import { isPrismaKnownRequestError } from '../../shared/utils/prisma-error';
import { liveStreamSelect } from './live-streams.constants';
import { pickLocalized, type ContentLocale } from '../../shared/middlewares/locale.middleware';
import type { CreateLiveStreamInput, UpdateLiveStreamInput } from './live-streams.types';

/** Adds the locale-resolved `title` alongside the raw AR/EN fields. */
const withLocalizedFields = <T extends { titleAr?: string | null; titleEn?: string | null }>(
  stream: T,
  locale: ContentLocale,
) => ({
  ...stream,
  title: pickLocalized(locale, stream.titleAr, stream.titleEn),
});

export const liveStreamsService = {
  async getLiveStreams(page = 1, limit = 10, locale: ContentLocale = 'ar') {
    const where = { isActive: true };
    const [total, liveStreams] = await Promise.all([
      prisma.liveStream.count({ where }),
      prisma.liveStream.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: liveStreamSelect,
      }),
    ]);

    return { data: liveStreams.map((stream) => withLocalizedFields(stream, locale)), total, page, limit };
  },

  async getLiveStreamById(id: string, locale: ContentLocale = 'ar') {
    const liveStream = await prisma.liveStream.findUnique({
      where: { id },
      select: liveStreamSelect,
    });

    if (!liveStream) {
      throw new AppError('Live stream was not found', 404);
    }

    return withLocalizedFields(liveStream, locale);
  },

  async createLiveStream(input: CreateLiveStreamInput) {
    return prisma.liveStream.create({
      data: {
        titleAr: input.titleAr.trim(),
        titleEn: input.titleEn.trim(),
        youtubeUrl: input.youtubeUrl.trim(),
        isActive: input.isActive ?? true,
      },
      select: liveStreamSelect,
    });
  },

  async updateLiveStream(input: UpdateLiveStreamInput) {
    try {
      return await prisma.liveStream.update({
        where: { id: input.id },
        data: {
          ...(input.titleAr !== undefined ? { titleAr: input.titleAr.trim() } : {}),
          ...(input.titleEn !== undefined ? { titleEn: input.titleEn.trim() } : {}),
          ...(input.youtubeUrl !== undefined ? { youtubeUrl: input.youtubeUrl.trim() } : {}),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        },
        select: liveStreamSelect,
      });
    } catch (error) {
      if (isPrismaKnownRequestError(error, 'P2025')) {
        throw new AppError('Live stream was not found', 404);
      }

      throw error;
    }
  },

  async deleteLiveStream(id: string) {
    try {
      await prisma.liveStream.delete({ where: { id } });
    } catch (error) {
      if (isPrismaKnownRequestError(error, 'P2025')) {
        throw new AppError('Live stream was not found', 404);
      }

      throw error;
    }
  },
};
