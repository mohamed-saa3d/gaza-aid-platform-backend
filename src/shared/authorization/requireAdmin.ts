import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/app-error';
import { type AuthTokenPayload, verifyToken } from '../utils/jwt';

const getBearerToken = (authorizationHeader?: string): string | null => {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
};

export const requireAdmin = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const token = getBearerToken(req.headers.authorization);

    if (!token) {
      throw new AppError('Authentication token is required', 401);
    }

    const payload = verifyToken(token);

    if (payload.role !== 'ADMIN') {
      throw new AppError('Forbidden: Admin access required', 403);
    }

    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }

    next(new AppError('Invalid or expired authentication token', 401));
  }
};
