import { prisma } from '../../shared/database/prisma';
import type { SubmitRatingInput } from './ratings.types';
import { AppError } from '../../shared/errors/app-error';

export const ratingsService = {
  async submitRating(userId: string, projectId: string, input: SubmitRatingInput) {
    return prisma.$transaction(async (tx) => {
      const rating = await tx.rating.upsert({
        where: {
          userId_projectId: {
            userId,
            projectId,
          },
        },
        create: {
          user: { connect: { id: userId } },
          project: { connect: { id: projectId } },
          value: input.value,
          comment: input.comment,
        },
        update: {
          value: input.value,
          comment: input.comment,
        },
      });

      const aggregate = await tx.rating.aggregate({
        where: { projectId },
        _avg: { value: true },
        _count: { id: true },
      });

      const ratingAverage = aggregate._avg?.value ?? 0;
      const ratingCount = aggregate._count.id;

      await tx.project.update({
        where: { id: projectId },
        data: {
          ratingAverage,
          ratingCount,
        },
      });

      return rating;
    });
  },

  async getProjectRatings(projectId: string, page: number, limit: number) {
    return prisma.rating.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      skip: (Math.max(page, 1) - 1) * Math.max(limit, 1),
      take: Math.max(limit, 1),
    });
  },
};
