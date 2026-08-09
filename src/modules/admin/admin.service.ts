import { AdminRole, Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import { prisma } from '../../shared/database/prisma';
import { AppError } from '../../shared/errors/app-error';

const PASSWORD_SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);

const adminSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AdminSelect;

export type CreateAdminInput = {
  name: string;
  email: string;
  password: string;
  role?: AdminRole;
};

export type UpdateAdminInput = {
  id: string;
  name?: string;
  role?: AdminRole;
};

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
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new AppError('An admin with this email already exists', 409);
      }

      throw error;
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
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new AppError('Admin was not found', 404);
      }

      throw error;
    }
  },

  async deleteAdmin(id: string) {
    try {
      await prisma.admin.delete({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new AppError('Admin was not found', 404);
      }

      throw error;
    }
  },
};
