import { prisma } from '../../shared/database/prisma';
import type { SubmitRatingInput } from './ratings.types';

export const ratingsService = {
  async submitRating(userId: string, input: SubmitRatingInput) {
    return prisma.platformRating.upsert({
      where: { userId },
      create: {
        user: { connect: { id: userId } },
        value: input.value,
        comment: input.comment,
      },
      update: {
        value: input.value,
        comment: input.comment,
      },
    });
  },

  async getPlatformRatings(page: number, limit: number) {
    return prisma.platformRating.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (Math.max(page, 1) - 1) * Math.max(limit, 1),
      take: Math.max(limit, 1),
    });
  },

  async getPlatformStats() {
    const aggregate = await prisma.platformRating.aggregate({
      _avg: { value: true },
      _count: { id: true },
    });

    return {
      average: aggregate._avg?.value ?? 0,
      totalRatings: aggregate._count.id,
    };
  },
};
