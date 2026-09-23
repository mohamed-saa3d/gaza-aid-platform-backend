import { AdminRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '../../shared/database/prisma';
import { AppError } from '../../shared/errors/app-error';
import { signRefreshToken, signToken } from '../../shared/utils/jwt';
import { adminSelect } from './admin.constants';
import type { AdminLoginInput } from './admin.types';

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const adminService = {
  async login(input: AdminLoginInput) {
    const normalizedEmail = normalizeEmail(input.email);

    const admin = await prisma.admin.findUnique({
      where: { email: normalizedEmail },
    });

    if (!admin) {
      throw new AppError('Invalid email or password', 401);
    }

    if (admin.deletedAt || admin.isActive === false) {
      throw new AppError('Admin account is inactive', 403);
    }

    const isPasswordValid = await bcrypt.compare(input.password, admin.passwordHash);

    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    return {
      accessToken: signToken({
        id: admin.id,
        role: admin.role,
        email: admin.email,
        isAdmin: true,
      }),
      refreshToken: signRefreshToken({
        id: admin.id,
        role: admin.role,
        email: admin.email,
        isAdmin: true,
        sessionId: crypto.randomUUID(),
      }),
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    };
  },

  async getProfile(adminId: string) {
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: adminSelect,
    });

    if (!admin) {
      throw new AppError('Admin was not found', 404);
    }

    return admin;
  },
};
