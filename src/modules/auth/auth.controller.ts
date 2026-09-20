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

const userCookieNames = {
  access: 'userAccessToken',
  refresh: 'userRefreshToken',
  role: 'userRole',
  scope: 'authScope',
};

const adminCookieNames = {
  access: 'adminAccessToken',
  refresh: 'adminRefreshToken',
  role: 'adminRole',
  scope: 'authScope',
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

    res.clearCookie('adminAccessToken', cookieBaseOptions);
    res.clearCookie('adminRefreshToken', cookieBaseOptions);
    res.clearCookie('adminRole', cookieBaseOptions);
    res.cookie(userCookieNames.access, accessToken, accessTokenCookieOptions);
    res.cookie(userCookieNames.refresh, refreshToken, refreshTokenCookieOptions);
    res.cookie(userCookieNames.role, user.role, { ...cookieBaseOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.cookie(userCookieNames.scope, 'user', { ...cookieBaseOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.clearCookie('accessToken', cookieBaseOptions);
    res.clearCookie('refreshToken', cookieBaseOptions);

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
    const authScope = req.cookies?.authScope || req.cookies?.scope;
    console.info('[AUTH REFRESH]', {
      correlationId: req.headers['x-correlation-id'] || 'n/a',
      method: req.method,
      route: req.originalUrl,
      authScope: authScope || 'unknown',
      cookiePresence: {
        userRefreshToken: Boolean(req.cookies?.userRefreshToken),
        adminRefreshToken: Boolean(req.cookies?.adminRefreshToken),
        refreshToken: Boolean(req.cookies?.refreshToken),
        authScopeCookie: Boolean(req.cookies?.authScope),
      },
      hasAuthorizationHeader: Boolean(authHeader),
    });
    const refreshTokenFromCookie = authScope === 'admin'
      ? req.cookies?.adminRefreshToken || req.cookies?.refreshToken
      : authScope === 'user'
        ? req.cookies?.userRefreshToken || req.cookies?.refreshToken
        : req.cookies?.userRefreshToken || req.cookies?.adminRefreshToken || req.cookies?.refreshToken;
    const refreshTokenValue = refreshTokenFromCookie ||
      (typeof authHeader === 'string' ? authHeader.split(' ')[1] : undefined);

    if (!refreshTokenValue) {
      throw new AppError('Refresh token is missing', 401);
    }

    const { accessToken, refreshToken: rotatedRefreshToken } =
      await authService.refreshAccessToken(refreshTokenValue);

    const identityScope = refreshTokenValue && (() => {
      try {
        const payload = require('jsonwebtoken').verify(refreshTokenValue, process.env.JWT_REFRESH_SECRET!);
        console.info('[AUTH REFRESH] decoded refresh claims', {
          correlationId: req.headers['x-correlation-id'] || 'n/a',
          route: req.originalUrl,
          userId: payload.id,
          role: payload.role,
          isAdmin: Boolean(payload.isAdmin),
          sessionId: payload.sessionId || null,
          exp: payload.exp,
          iat: payload.iat,
        });
        return payload.isAdmin ? 'admin' : 'user';
      } catch (error) {
        console.warn('[AUTH REFRESH] refresh verification failed', {
          correlationId: req.headers['x-correlation-id'] || 'n/a',
          route: req.originalUrl,
          error: error instanceof Error ? error.message : 'unknown',
        });
        return 'user';
      }
    })();

    const targetAccessCookie = identityScope === 'admin' ? 'adminAccessToken' : 'userAccessToken';
    const targetRefreshCookie = identityScope === 'admin' ? 'adminRefreshToken' : 'userRefreshToken';
    const targetRoleCookie = identityScope === 'admin' ? 'adminRole' : 'userRole';
    const targetScopeCookie = identityScope === 'admin' ? 'admin' : 'user';

    res.clearCookie('accessToken', cookieBaseOptions);
    res.clearCookie('refreshToken', cookieBaseOptions);
    res.cookie(targetAccessCookie, accessToken, accessTokenCookieOptions);
    res.cookie(targetRefreshCookie, rotatedRefreshToken, refreshTokenCookieOptions);
    res.cookie(targetRoleCookie, identityScope === 'admin' ? 'ADMIN' : 'DONOR', { ...cookieBaseOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.cookie('authScope', targetScopeCookie, { ...cookieBaseOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

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
    const refreshToken = req.cookies?.userRefreshToken || req.cookies?.adminRefreshToken || req.cookies?.refreshToken;

    if (refreshToken) {
      await authService.revokeRefreshToken(refreshToken);
    }

    res.clearCookie('accessToken', cookieBaseOptions);
    res.clearCookie('refreshToken', cookieBaseOptions);
    res.clearCookie('userAccessToken', cookieBaseOptions);
    res.clearCookie('userRefreshToken', cookieBaseOptions);
    res.clearCookie('adminAccessToken', cookieBaseOptions);
    res.clearCookie('adminRefreshToken', cookieBaseOptions);
    res.clearCookie('userRole', cookieBaseOptions);
    res.clearCookie('adminRole', cookieBaseOptions);
    res.clearCookie('authScope', cookieBaseOptions);

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
