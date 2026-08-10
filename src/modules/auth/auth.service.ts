import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Prisma, Role } from '@prisma/client';
import { prisma } from '../../shared/database/prisma';
import { AppError } from '../../shared/errors/app-error';
import { signToken } from '../../shared/utils/jwt';
import { emailService } from '../../shared/services/email.service';

const userSelect = {
  id: true,
  name: true,
  email: true,
  image: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');
const normalizeEmail = (email: string): string => email.trim().toLowerCase();
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

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

export const authService = {
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
    const otp = generateOTP();
    const otpHash = hashToken(otp);
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    try {
      await prisma.user.create({
        data: {
          name: input.name.trim(),
          email,
          passwordHash,
          image: input.image,
          role: Role.DONOR,
          tokens: {
            create: {
              token: otpHash,
              type: 'EMAIL_VERIFICATION',
              expiresAt: verificationExpires,
            },
          },
        },
      });

      await emailService.sendVerificationEmail(email, otp);
      return {
        message: 'OTP sent successfully to your email',
        redirectTo: '/verify-otp',
      };
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

  async verifyEmail(otp: string) {
    const tokenHash = hashToken(otp);
    const authToken = await prisma.authToken.findUnique({
      where: { token: tokenHash },
      select: {
        id: true,
        userId: true,
        type: true,
        expiresAt: true,
      },
    });

    if (
      !authToken ||
      authToken.type !== 'EMAIL_VERIFICATION' ||
      authToken.expiresAt <= new Date()
    ) {
      throw new AppError('Invalid or expired email verification token', 400);
    }

    const [user] = await prisma.$transaction([
      prisma.user.update({
        where: { id: authToken.userId },
        data: { isEmailVerified: true },
        select: userSelect,
      }),
      prisma.authToken.delete({ where: { id: authToken.id } }),
    ]);

    return user;
  },

  async forgotPassword(email: string) {
    const normalizedEmail = normalizeEmail(email);
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (!user) {
      return {
        message: 'Password reset OTP sent to your email',
        redirectTo: '/reset-password',
      };
    }

    const otp = generateOTP();
    const otpHash = hashToken(otp);
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.authToken.create({
      data: {
        token: otpHash,
        type: 'PASSWORD_RESET',
        expiresAt: resetExpires,
        user: { connect: { id: user.id } },
      },
    });

    await emailService.sendPasswordResetEmail(normalizedEmail, otp);
    return {
      message: 'Password reset OTP sent to your email',
      redirectTo: '/reset-password',
    };
  },

  async resetPassword(otp: string, newPassword: string) {
    const tokenHash = hashToken(otp);
    const authToken = await prisma.authToken.findUnique({
      where: { token: tokenHash },
      select: {
        id: true,
        userId: true,
        type: true,
        expiresAt: true,
      },
    });

    if (
      !authToken ||
      authToken.type !== 'PASSWORD_RESET' ||
      authToken.expiresAt <= new Date()
    ) {
      throw new AppError('Invalid or expired password reset token', 400);
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    const [user] = await prisma.$transaction([
      prisma.user.update({
        where: { id: authToken.userId },
        data: { passwordHash },
        select: userSelect,
      }),
      prisma.authToken.delete({ where: { id: authToken.id } }),
    ]);

    return user;
  },

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user) {
      throw new AppError('User was not found', 404);
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);

    if (!isPasswordValid) {
      throw new AppError('Old password is incorrect', 401);
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    return prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
      select: userSelect,
    });
  },
};
