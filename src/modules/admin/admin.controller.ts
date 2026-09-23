import type { RequestHandler } from 'express';
import { env } from '../../config/env';
import { adminService } from './admin.service';
import { authService } from '../auth/auth.service';
import { AppError } from '../../shared/errors/app-error';

const getDurationInMs = (value: string): number => {
  const normalizedValue = value.trim().toLowerCase();
  const match = normalizedValue.match(/^(\d+)(ms|s|m|h|d)$/);

  if (!match) {
    return 15 * 60 * 1000;
  }

  const amount = Number(match[1]);
  const unit = match[2];

  const multipliers = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  } as const;

  return amount * multipliers[unit as keyof typeof multipliers];
};

const cookieBaseOptions = {
  httpOnly: true,
  path: '/',
  sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
  secure: process.env.NODE_ENV === 'production',
};

const accessTokenCookieOptions = {
  ...cookieBaseOptions,
  maxAge: getDurationInMs(env.JWT_EXPIRES_IN),
};

const refreshTokenCookieOptions = {
  ...cookieBaseOptions,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const adminCookieNames = {
  access: 'adminAccessToken',
  refresh: 'adminRefreshToken',
  role: 'adminRole',
};

export const adminLogin: RequestHandler = async (req, res, next) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const { accessToken, refreshToken, admin } = await adminService.login({ email, password });

    res.cookie(adminCookieNames.access, accessToken, accessTokenCookieOptions);
    res.cookie(adminCookieNames.refresh, refreshToken, refreshTokenCookieOptions);
    res.cookie(adminCookieNames.role, admin.role, { ...cookieBaseOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.status(200).json({
      success: true,
      message: 'Admin logged in successfully',
      data: { accessToken, admin },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshAdminToken: RequestHandler = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.adminRefreshToken;

    if (!refreshToken) {
      throw new AppError('Refresh token is missing', 401);
    }

    const { accessToken, refreshToken: rotatedRefreshToken, role } =
      await authService.refreshAdminAccessToken(refreshToken);

    res.cookie(adminCookieNames.access, accessToken, accessTokenCookieOptions);
    res.cookie(adminCookieNames.refresh, rotatedRefreshToken, refreshTokenCookieOptions);
    res.cookie(adminCookieNames.role, role, { ...cookieBaseOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.status(200).json({
      success: true,
      message: 'Access token refreshed successfully',
      data: { accessToken },
    });
  } catch (error) {
    next(error);
  }
};

export const logoutAdmin: RequestHandler = async (_req, res, next) => {
  try {
    res.clearCookie(adminCookieNames.access, cookieBaseOptions);
    res.clearCookie(adminCookieNames.refresh, cookieBaseOptions);
    res.clearCookie(adminCookieNames.role, cookieBaseOptions);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminProfile: RequestHandler = async (req, res, next) => {
  try {
    const admin = await adminService.getProfile(req.user!.id);

    res.status(200).json({
      success: true,
      message: 'Admin profile fetched successfully',
      data: admin,
    });
  } catch (error) {
    next(error);
  }
};
