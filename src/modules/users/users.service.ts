import bcrypt from 'bcryptjs';
import { Prisma, Role } from '@prisma/client';
import { prisma } from '../../shared/database/prisma';
import { AppError } from '../../shared/errors/app-error';
import { signToken } from '../../shared/utils/jwt';

const userSelect = {
  id: true,
  name: true,
  email: true,
  image: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

type RegisterInput = {
  name: string;
  email: string;
  password: string;
  image?: string;
};

type LoginInput = {
  email: string;
  password: string;
};

type UpdateProfileInput = {
  userId: string;
  name?: string;
  image?: string | null;
};

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const usersService = {
  async register(input: RegisterInput) {
    const email = normalizeEmail(input.email);
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw new AppError('A user with this email already exists', 409);
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    try {
      return await prisma.user.create({
        data: {
          name: input.name.trim(),
          email,
          passwordHash,
          image: input.image,
          role: Role.DONOR,
        },
        select: userSelect,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new AppError('A user with this email already exists', 409);
      }

      throw error;
    }
  },

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: normalizeEmail(input.email) },
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    const token = signToken({
      id: user.id,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  },

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
