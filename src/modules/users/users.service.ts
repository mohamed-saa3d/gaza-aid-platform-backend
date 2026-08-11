import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '../../shared/database/prisma';
import { AppError } from '../../shared/errors/app-error';
import { userSelect } from './users.constants';
import type { ChangePasswordInput, UpdateProfileInput } from './users.types';

export const usersService = {
  async getProfile(userId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: userSelect,
    });

    if (!user) {
      throw new AppError('User was not found', 404);
    }

    return user;
  },

  async updateProfile(input: UpdateProfileInput) {
    try {
      const updateData: Record<string, unknown> = {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.avatar !== undefined ? { avatar: input.avatar } : {}),
      };

      const updateResult = await prisma.user.updateMany({
        where: { id: input.userId, deletedAt: null },
        data: updateData,
      });

      if (updateResult.count === 0) {
        throw new AppError('User was not found', 404);
      }

      return prisma.user.findUnique({
        where: { id: input.userId },
        select: userSelect,
      });
    } catch (error) {
      throw error;
    }
  },

  async changePassword(input: ChangePasswordInput) {
    const user = await prisma.user.findFirst({
      where: { id: input.userId, deletedAt: null },
      select: { password: true },
    });

    if (!user) {
      throw new AppError('User was not found', 404);
    }

    const isPasswordValid = await bcrypt.compare(input.oldPassword, user.password);

    if (!isPasswordValid) {
      throw new AppError('Old password is incorrect', 401);
    }

    const passwordHash = await bcrypt.hash(input.newPassword, 12);

    const updateResult = await prisma.user.updateMany({
      where: { id: input.userId, deletedAt: null },
      data: { password: passwordHash },
    });

    if (updateResult.count === 0) {
      throw new AppError('User was not found', 404);
    }

    return prisma.user.findUnique({
      where: { id: input.userId },
      select: userSelect,
    });
  },

  async softDeleteAccount(userId: string) {
    const updateResult = await prisma.user.updateMany({
      where: { id: userId, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    if (updateResult.count === 0) {
      throw new AppError('User was not found', 404);
    }

    return prisma.user.findUnique({
      where: { id: userId },
      select: userSelect,
    });
  },

  async getAllUsers(page: number, limit: number) {
    return prisma.user.findMany({
      where: { deletedAt: null },
      select: userSelect,
      orderBy: { createdAt: 'desc' },
      skip: (Math.max(page, 1) - 1) * Math.max(limit, 1),
      take: Math.max(limit, 1),
    });
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
