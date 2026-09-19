import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Prisma, Role } from '@prisma/client';
import { prisma } from '../../shared/database/prisma';
import { AppError } from '../../shared/errors/app-error';
import { isPrismaKnownRequestError } from '../../shared/utils/prisma-error';
import { signRefreshToken, signToken, verifyRefreshToken } from '../../shared/utils/jwt';
import { emailService } from '../../shared/services/email.service';
import redisClient, { isRedisReady } from '../../config/redis.config';
import { userSelect } from './auth.constants';
import type { LoginInput, PendingRegistration, RegisterInput } from './auth.types';

const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');
const normalizeEmail = (email: string): string => email.trim().toLowerCase();
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const VERIFICATION_EMAIL_TIMEOUT_MS = 5000;
const REGISTRATION_TTL_SECONDS = 15 * 60;
const registrationKey = (email: string): string => `reg:${normalizeEmail(email)}`;

const sendVerificationEmailNonBlocking = (email: string, otp: string): void => {
  void (async () => {
    try {
      await Promise.race([
        emailService.sendVerificationEmail(email, otp),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Verification email timed out')), VERIFICATION_EMAIL_TIMEOUT_MS);
        }),
      ]);
    } catch (error: unknown) {
      console.error('Failed to send verification email', error);
    }
  })();
};

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

    const otp = generateOTP();
    const otpHash = hashToken(otp);
    const pendingRegistration: PendingRegistration = {
      name: input.name.trim(),
      email,
      password: input.password,
      image: input.image,
      otpHash,
      createdAt: Date.now(),
    };

    try {
      if (!isRedisReady()) {
        throw new AppError('Registration service is temporarily unavailable', 503);
      }

      await redisClient.setEx(
        registrationKey(email),
        REGISTRATION_TTL_SECONDS,
        JSON.stringify(pendingRegistration),
      );

      sendVerificationEmailNonBlocking(email, otp);
      return {
        message: 'تم إرسال رمز التحقق، يرجى تأكيد البريد لإنشاء الحساب',
        redirectTo: '/verify-otp',
      };
    } catch (error) {
      throw error;
    }
  },

  async resendVerificationOtp(email: string) {
    const normalizedEmail = normalizeEmail(email);
    const pendingKey = registrationKey(normalizedEmail);

    if (isRedisReady()) {
      const pendingValue = await redisClient.get(pendingKey);

      if (pendingValue) {
        const pending = JSON.parse(pendingValue) as PendingRegistration;
        if (pending.createdAt > Date.now() - 60 * 1000) {
          throw new AppError('يرجى الانتظار دقيقة واحدة قبل طلب رمز جديد', 429);
        }

        const otp = generateOTP();
        const updatedPending: PendingRegistration = {
          ...pending,
          otpHash: hashToken(otp),
          createdAt: Date.now(),
        };

        await redisClient.setEx(
          pendingKey,
          REGISTRATION_TTL_SECONDS,
          JSON.stringify(updatedPending),
        );
        sendVerificationEmailNonBlocking(normalizedEmail, otp);

        return {
          message: 'OTP sent successfully to your email',
          redirectTo: '/verify-otp',
        };
      }
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, isEmailVerified: true },
    });

    if (!user || user.isEmailVerified) {
      return {
        message: 'If the account exists and needs verification, a new OTP was sent',
        redirectTo: '/verify-otp',
      };
    }

    const cooldownSince = new Date(Date.now() - 60 * 1000);
    const recentToken = await prisma.authToken.findFirst({
      where: {
        userId: user.id,
        type: 'EMAIL_VERIFICATION',
        createdAt: { gt: cooldownSince },
      },
      select: { id: true },
    });

    if (recentToken) {
      throw new AppError('يرجى الانتظار دقيقة واحدة قبل طلب رمز جديد', 429);
    }

    const otp = generateOTP();
    const otpHash = hashToken(otp);
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.authToken.create({
      data: {
        token: otpHash,
        type: 'EMAIL_VERIFICATION',
        expiresAt: verificationExpires,
        user: { connect: { id: user.id } },
      },
    });

    sendVerificationEmailNonBlocking(normalizedEmail, otp);

    return {
      message: 'OTP sent successfully to your email',
      redirectTo: '/verify-otp',
    };
  },

  async login(input: LoginInput) {
    const email = normalizeEmail(input.email);
    const user = await prisma.user.findUnique({
      where: { email },
    });

    const admin = user
      ? null
      : await prisma.admin.findUnique({
          where: { email },
        });

    if (!user && !admin) {
      throw new AppError('Invalid email or password', 401);
    }

    if (admin) {
      if (admin.deletedAt || !admin.isActive) {
        throw new AppError('Admin account is inactive', 403);
      }

      const isPasswordValid = await bcrypt.compare(input.password, admin.passwordHash);

      if (!isPasswordValid) {
        throw new AppError('Invalid email or password', 401);
      }

      const accessToken = signToken({
        id: admin.id,
        role: admin.role,
        email: admin.email,
        isAdmin: true,
      });
      const refreshToken = signRefreshToken({
        id: admin.id,
        role: admin.role,
        email: admin.email,
        isAdmin: true,
        sessionId: crypto.randomUUID(),
      });

      return {
        accessToken,
        refreshToken,
        user: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          avatar: null,
          role: admin.role,
          createdAt: admin.createdAt,
          updatedAt: admin.updatedAt,
        },
      };
    }

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
      email: user.email,
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

    if (payload.isAdmin) {
      const nextSessionId = crypto.randomUUID();
      const nextRefreshToken = signRefreshToken({
        id: payload.id,
        role: payload.role,
        email: payload.email,
        isAdmin: true,
        sessionId: nextSessionId,
      });

      return {
        accessToken: signToken({
          id: payload.id,
          role: payload.role,
          email: payload.email,
          isAdmin: true,
        }),
        refreshToken: nextRefreshToken,
      };
    }

    try {
      const tokenHash = hashToken(refreshToken);
      const session = await prisma.refreshSession.findFirst({
        where: {
          tokenHash,
        },
        select: {
          id: true,
          familyId: true,
          userId: true,
          revokedAt: true,
          expiresAt: true,
        },
      });

      if (
        !session ||
        session.id !== payload.sessionId ||
        session.revokedAt ||
        session.expiresAt <= new Date()
      ) {
        throw new AppError('Refresh token is invalid or expired', 401);
      }

      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { id: true, role: true, deletedAt: true },
      });

      if (!user || user.deletedAt) {
        throw new AppError('Refresh token is invalid or user no longer exists', 401);
      }

      const revoked = await prisma.refreshSession.updateMany({
        where: {
          id: session.id,
          tokenHash,
        },
        data: {
          revokedAt: new Date(),
          tokenHash: crypto.randomBytes(32).toString('hex'),
        },
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

      await prisma.refreshSession.create({
        data: {
          id: nextSessionId,
          userId: user.id,
          familyId: session.familyId,
          tokenHash: hashToken(nextRefreshToken),
          expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
        },
      });

      return {
        accessToken: signToken({
          id: user.id,
          role: user.role,
        }),
        refreshToken: nextRefreshToken,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError('Unable to refresh session. Please log in again.', 401);
    }
  },

  async revokeRefreshToken(refreshToken: string) {
    await prisma.refreshSession.updateMany({
      where: { tokenHash: hashToken(refreshToken) },
      data: {
        revokedAt: new Date(),
        tokenHash: crypto.randomBytes(32).toString('hex'),
      },
    });
  },

  async verifyEmail(email: string, otp: string) {
    const normalizedEmail = normalizeEmail(email);

    if (isRedisReady()) {
      const pendingKey = registrationKey(normalizedEmail);
      const pendingValue = await redisClient.get(pendingKey);

      if (pendingValue) {
        const pending = JSON.parse(pendingValue) as PendingRegistration;

        if (pending.createdAt <= Date.now() - REGISTRATION_TTL_SECONDS * 1000) {
          await redisClient.del(pendingKey);
          throw new AppError('Invalid or expired email verification token', 400);
        }

        if (hashToken(otp) !== pending.otpHash) {
          throw new AppError('Invalid or expired email verification token', 400);
        }

        try {
          const passwordHash = await bcrypt.hash(pending.password, 12);
          const createdUser = await prisma.user.create({
            data: {
              name: pending.name,
              email: pending.email,
              password: passwordHash,
              avatar: pending.image,
              role: Role.DONOR,
              isEmailVerified: true,
            },
            select: userSelect,
          });

          await redisClient.del(pendingKey);
          return createdUser;
        } catch (error) {
          if (isPrismaKnownRequestError(error, 'P2002')) {
            throw new AppError('A user with this email already exists', 409);
          }

          throw error;
        }
      }
    }

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
        where: { userId: authToken.userId },
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
      prisma.refreshSession.updateMany({
        where: { userId: authToken.userId },
        data: { revokedAt: new Date() },
      }),
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
        where: { userId },
        data: { revokedAt: new Date() },
      }),
    ]);

    return updatedUser;
  },
};
