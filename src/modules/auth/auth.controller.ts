import type { Request, RequestHandler } from 'express';
import { env } from '../../config/env';
import { AppError } from '../../shared/errors/app-error';
import { authService } from './auth.service';

const getDurationInMs = (value: string): number => {
  const normalizedValue = value.trim().toLowerCase();
  const match = normalizedValue.match(/^(\d+)(ms|s|m|h|d)$/);

  if (!match) {
    return 7 * 24 * 60 * 60 * 1000;
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
  maxAge: getDurationInMs(env.JWT_REFRESH_EXPIRES_IN),
};

const getAuthenticatedUserId = (req: Request): string => {
  if (!req.user?.id) {
    throw new AppError('Authentication is required', 401);
  }

  return req.user.id;
};

export const register: RequestHandler = async (req, res, next) => {
  try {
    console.info(`[Auth] Incoming register request from ${req.ip}`);
    const { message, redirectTo } = await authService.register(req.body);

    res.status(201).json({
      success: true,
      message,
      data: { redirectTo },
    });
  } catch (error) {
    next(error);
  }
};

export const login: RequestHandler = async (req, res, next) => {
  try {
    const { accessToken, refreshToken, user } = await authService.login(req.body);

    res.cookie('accessToken', accessToken, accessTokenCookieOptions);
    res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);

    res.status(200).json({
      success: true,
      message: 'User logged in successfully',
      data: {
        accessToken,
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail: RequestHandler = async (req, res, next) => {
  try {
    const user = await authService.verifyEmail(req.body.email, req.body.otp);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const resendOtp: RequestHandler = async (req, res, next) => {
  try {
    console.info(`[Auth] Incoming resend-otp request from ${req.ip}`);
    const { message, redirectTo } = await authService.resendVerificationOtp(req.body.email);

    res.status(200).json({
      success: true,
      message,
      data: { redirectTo },
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword: RequestHandler = async (req, res, next) => {
  try {
    const { message, redirectTo } = await authService.forgotPassword(req.body.email);

    res.status(200).json({
      success: true,
      message,
      data: { redirectTo },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const refreshTokenFromCookie = req.cookies?.refreshToken;
    const refreshTokenValue = refreshTokenFromCookie ||
      (typeof authHeader === 'string' ? authHeader.split(' ')[1] : undefined);

    if (!refreshTokenValue) {
      throw new AppError('Refresh token is missing', 401);
    }

    const { accessToken, refreshToken: rotatedRefreshToken } =
      await authService.refreshAccessToken(refreshTokenValue);

    res.cookie('accessToken', accessToken, accessTokenCookieOptions);
    res.cookie('refreshToken', rotatedRefreshToken, refreshTokenCookieOptions);

    res.status(200).json({
      success: true,
      message: 'Access token refreshed successfully',
      data: { accessToken },
    });
  } catch (error) {
    next(error);
  }
};

export const logout: RequestHandler = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      await authService.revokeRefreshToken(refreshToken);
    }

    res.clearCookie('accessToken', cookieBaseOptions);
    res.clearCookie('refreshToken', cookieBaseOptions);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword: RequestHandler = async (req, res, next) => {
  try {
    await authService.resetPassword(req.body.otp, req.body.newPassword);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword: RequestHandler = async (req, res, next) => {
  try {
    const user = await authService.changePassword(
      getAuthenticatedUserId(req),
      req.body.oldPassword,
      req.body.newPassword,
    );

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
