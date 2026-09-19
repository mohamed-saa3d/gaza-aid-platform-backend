import type { Request, RequestHandler } from 'express';
import { AppError } from '../../shared/errors/app-error';
import { authService } from './auth.service';

const cookieOptions = {
  httpOnly: true,
  path: '/',
  sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
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

    res.cookie('refreshToken', refreshToken, cookieOptions);

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
    console.log('Incoming Refresh Request Cookies:', req.cookies);
    console.log('Incoming Refresh Request Authorization Header:', req.headers.authorization);

    const authHeader = req.headers.authorization;
    const refreshTokenFromCookie = req.cookies?.refreshToken;
    const refreshTokenValue = refreshTokenFromCookie ??
      (typeof authHeader === 'string' && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined);

    if (!refreshTokenValue) {
      throw new AppError('Refresh token is missing', 401);
    }

    const { accessToken, refreshToken: rotatedRefreshToken } =
      await authService.refreshAccessToken(refreshTokenValue);

    res.cookie('refreshToken', rotatedRefreshToken, cookieOptions);

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

    res.clearCookie('refreshToken', {
      httpOnly: true,
      path: '/',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

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
