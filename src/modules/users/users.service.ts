import { Prisma } from '@prisma/client';
import { prisma } from '../../shared/database/prisma';
import { AppError } from '../../shared/errors/app-error';
import { userSelect } from './users.constants';
import type { UpdateProfileInput } from './users.types';

export const usersService = {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: userSelect,
    });

    if (!user) {
      throw new AppError('User was not found', 404);
    }

    return user;
  },

  async updateProfile(input: UpdateProfileInput) {
    try {
      return await prisma.user.update({
        where: { id: input.userId },
        data: {
          ...(input.name !== undefined ? { name: input.name.trim() } : {}),
          ...(input.image !== undefined ? { image: input.image } : {}),
        },
        select: userSelect,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new AppError('User was not found', 404);
      }

      throw error;
    }
  },

  getUserDonations(userId: string) {
    return prisma.donation.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        project: {
          select: {
            id: true,
            titleAr: true,
            titleEn: true,
            imageUrl: true,
            status: true,
          },
        },
      },
    });
  },
};
