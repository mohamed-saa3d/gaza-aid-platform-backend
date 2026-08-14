import type { NextFunction, Request, Response } from 'express';
import { Role } from '@prisma/client';
import { AppError } from '../errors/app-error';
import { type AuthTokenPayload, verifyToken } from '../utils/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

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

export const authenticateUser = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const token = getBearerToken(req.headers.authorization);

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Authentication token is required',
    });
    return;
  }

  try {
    req.user = verifyToken(token);
    next();
    return;
  } catch {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token',
    });
    return;
  }
};

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  authenticateUser(req, res, next);
};

export const requireUser = (req: Request, res: Response, next: NextFunction): void => {
  authenticateUser(req, res, (error?: unknown) => {
    if (error) {
      next(error);
      return;
    }

    if (!req.user || req.user.role !== Role.DONOR) {
      next(new AppError('Forbidden: User access required', 403));
      return;
    }

    next();
  });
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  authenticateUser(req, res, (error?: unknown) => {
    if (error) {
      next(error);
      return;
    }

    if (!req.user || (req.user.role !== 'ADMIN' && req.user.isAdmin !== true)) {
      next(new AppError('Forbidden: Admin access required', 403));
      return;
    }

    next();
  });
};
