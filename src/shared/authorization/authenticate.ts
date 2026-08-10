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

declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

export const authenticateUser = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const token = getBearerToken(req.headers.authorization);

    if (!token) {
      throw new AppError('Authentication token is required', 401);
    }

    req.user = verifyToken(token);
    next();
  } catch {
    next(new AppError('Invalid or expired authentication token', 401));
  }
};
