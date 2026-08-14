import { AdminRole, Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import { prisma } from '../../shared/database/prisma';
import { AppError } from '../../shared/errors/app-error';
import { isPrismaKnownRequestError } from '../../shared/utils/prisma-error';
import { signRefreshToken, signToken } from '../../shared/utils/jwt';
import { adminSelect } from './admin.constants';
import type { AdminLoginInput, CreateAdminInput, UpdateAdminInput } from './admin.types';

const PASSWORD_SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const adminService = {
  async createAdmin(input: CreateAdminInput) {
    const email = normalizeEmail(input.email);
    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingAdmin) {
      throw new AppError('An admin with this email already exists', 409);
    }

    try {
      const passwordHash = await bcrypt.hash(input.password, PASSWORD_SALT_ROUNDS);

      return await prisma.admin.create({
        data: {
          name: input.name.trim(),
          email,
          passwordHash,
          role: input.role ?? AdminRole.ADMIN,
        },
        select: adminSelect,
      });
    } catch (error) {
      if (isPrismaKnownRequestError(error, 'P2002')) {
        throw new AppError('An admin with this email already exists', 409);
      }

      throw error;
    }
  },

  async verifyRootAdminPassword(adminId: string, rootPassword: string) {
    const currentAdmin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: { passwordHash: true },
    });

    if (!currentAdmin) {
      throw new AppError('Invalid Root Admin credentials confirmation', 401);
    }

    const isPasswordValid = await bcrypt.compare(rootPassword, currentAdmin.passwordHash);

    if (!isPasswordValid) {
      throw new AppError('Invalid Root Admin credentials confirmation', 401);
    }
  },

  getAllAdmins() {
    return prisma.admin.findMany({
      select: adminSelect,
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  async login(input: AdminLoginInput) {
    const admin = await prisma.admin.findUnique({
      where: { email: normalizeEmail(input.email) },
    });

    if (!admin) {
      throw new AppError('Invalid email or password', 401);
    }

    const isPasswordValid = await bcrypt.compare(input.password, admin.passwordHash);

    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    if ('isActive' in admin && (admin as any).isActive === false) {
      throw new AppError('Admin account is inactive', 403);
    }

    return {
      accessToken: signToken({
        id: admin.id,
        role: 'ADMIN',
        email: admin.email,
        isAdmin: true,
      }),
      refreshToken: signRefreshToken({
        id: admin.id,
        role: 'ADMIN',
        email: admin.email,
        isAdmin: true,
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

  async updateAdmin(input: UpdateAdminInput) {
    try {
      return await prisma.admin.update({
        where: { id: input.id },
        data: {
          ...(input.name ? { name: input.name.trim() } : {}),
          ...(input.role ? { role: input.role } : {}),
        },
        select: adminSelect,
      });
    } catch (error) {
      if (isPrismaKnownRequestError(error, 'P2025')) {
        throw new AppError('Admin was not found', 404);
      }

      throw error;
    }
  },

  async deleteAdmin(id: string) {
    const admin = await prisma.admin.findUnique({
      where: { id },
      select: { id: true, deletedAt: true },
    });

    if (!admin) {
      throw new AppError('Admin was not found', 404);
    }

    const activeAdminCount = await prisma.admin.count({
      where: { role: AdminRole.ADMIN, deletedAt: null },
    });

    if (activeAdminCount <= 1) {
      throw new AppError('Cannot delete the sole remaining system administrator.', 400);
    }

    await prisma.admin.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { id };
  },
};
