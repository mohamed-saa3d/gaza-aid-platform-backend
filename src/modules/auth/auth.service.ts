import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Prisma, Role } from '@prisma/client';
import { prisma } from '../../shared/database/prisma';
import { AppError } from '../../shared/errors/app-error';
import { isPrismaKnownRequestError } from '../../shared/utils/prisma-error';
import { signRefreshToken, signToken, verifyRefreshToken } from '../../shared/utils/jwt';
import { emailService } from '../../shared/services/email.service';
import { userSelect } from './auth.constants';
import type { LoginInput, RegisterInput } from './auth.types';

const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');
const normalizeEmail = (email: string): string => email.trim().toLowerCase();
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const createRefreshSession = async (userId: string, role: string) => {
  const sessionId = crypto.randomUUID();
  const refreshToken = signRefreshToken({ id: userId, role, sessionId });

  await prisma.refreshSession.create({
    data: {
      id: sessionId,
      userId,
      familyId: crypto.randomUUID(),
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });

  return refreshToken;
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
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000);

    try {
      await prisma.user.create({
        data: {
          name: input.name.trim(),
          email,
          password: passwordHash,
          avatar: input.image,
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
      if (isPrismaKnownRequestError(error, 'P2002')) {
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

    if (!user.isEmailVerified) {
      throw new AppError('Please verify your email address before logging in', 403);
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.password);

    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    const accessToken = signToken({
      id: user.id,
      role: user.role,
    });

    const refreshToken = await createRefreshSession(user.id, user.role);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  },

  async refreshAccessToken(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken);

    if (!payload.sessionId) {
      throw new AppError('Refresh token is invalid or expired', 401);
    }

    const rotated = await prisma.$transaction(async (tx) => {
      const session = await tx.refreshSession.findFirst({
        where: {
          id: payload.sessionId,
          tokenHash: hashToken(refreshToken),
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        select: { id: true, familyId: true, userId: true },
      });

      if (!session) {
        throw new AppError('Refresh token is invalid or expired', 401);
      }

      const user = await tx.user.findFirst({
        where: { id: session.userId, deletedAt: null },
        select: { id: true, role: true },
      });

      if (!user) {
        throw new AppError('Refresh token is invalid or user no longer exists', 401);
      }

      const revoked = await tx.refreshSession.updateMany({
        where: { id: session.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      if (revoked.count !== 1) {
        throw new AppError('Refresh token has already been used', 401);
      }

      const nextSessionId = crypto.randomUUID();
      const nextRefreshToken = signRefreshToken({
        id: user.id,
        role: user.role,
        sessionId: nextSessionId,
      });

      await tx.refreshSession.create({
        data: {
          id: nextSessionId,
          userId: user.id,
          familyId: session.familyId,
          tokenHash: hashToken(nextRefreshToken),
          expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
        },
      });

      return { user, refreshToken: nextRefreshToken };
    });

    return {
      accessToken: signToken({
        id: rotated.user.id,
        role: rotated.user.role,
      }),
      refreshToken: rotated.refreshToken,
    };
  },

  async revokeRefreshToken(refreshToken: string) {
    await prisma.refreshSession.updateMany({
      where: { tokenHash: hashToken(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  async verifyEmail(email: string, otp: string) {
    const normalizedEmail = normalizeEmail(email);
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (!user) {
      throw new AppError('User was not found', 404);
    }

    const tokenHash = hashToken(otp);
    const authToken = await prisma.authToken.findFirst({
      where: { 
        token: tokenHash,
        userId: user.id,
        type: 'EMAIL_VERIFICATION'
      },
      select: {
        id: true,
        userId: true,
        type: true,
        expiresAt: true,
      },
    });

    if (
      !authToken ||
      authToken.expiresAt <= new Date()
    ) {
      throw new AppError('Invalid or expired email verification token', 400);
    }

    const [updatedUser] = await prisma.$transaction([
      prisma.user.update({
        where: { id: authToken.userId },
        data: { isEmailVerified: true },
        select: userSelect,
      }),
      prisma.authToken.delete({ where: { id: authToken.id } }),
      prisma.refreshSession.updateMany({
        where: { userId: authToken.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return updatedUser;
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
    const resetExpires = new Date(Date.now() + 15 * 60 * 1000);

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
    const authToken = await prisma.authToken.findFirst({
      where: { token: tokenHash, type: 'PASSWORD_RESET' },
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
        data: { password: passwordHash },
        select: userSelect,
      }),
      prisma.authToken.delete({ where: { id: authToken.id } }),
    ]);

    return user;
  },

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user) {
      throw new AppError('User was not found', 404);
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

    if (!isPasswordValid) {
      throw new AppError('Old password is incorrect', 401);
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    const [updatedUser] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { password: passwordHash },
        select: userSelect,
      }),
      prisma.refreshSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return updatedUser;
  },
};
