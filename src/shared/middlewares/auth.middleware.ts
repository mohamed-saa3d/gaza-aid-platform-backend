import type { NextFunction, Request, Response } from 'express';
import { AdminRole, Role } from '@prisma/client';
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

const getAccessToken = (req: Request): string | null => {
  const cookieToken = req.cookies?.accessToken;
  const bearerToken = getBearerToken(req.headers.authorization);

  if (cookieToken) {
    if (bearerToken) {
      try {
        const cookiePayload = verifyToken(cookieToken);
        const bearerPayload = verifyToken(bearerToken);

        const sameIdentity =
          cookiePayload.id === bearerPayload.id &&
          cookiePayload.role === bearerPayload.role &&
          (cookiePayload.email ?? null) === (bearerPayload.email ?? null) &&
          Boolean(cookiePayload.isAdmin) === Boolean(bearerPayload.isAdmin);

        if (!sameIdentity) {
          throw new AppError('Token identity mismatch', 401);
        }
      } catch {
        return null;
      }
    }

    return cookieToken;
  }

  return bearerToken;
};

export const authenticateUser = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const token = getAccessToken(req);

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized',
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
      message: 'Unauthorized',
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
      res.status(403).json({
        success: false,
        message: 'User access required',
      });
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

export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction): void => {
  authenticateUser(req, res, (error?: unknown) => {
    if (error) {
      next(error);
      return;
    }

    const rootAdminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const isConfiguredRootAdmin = Boolean(
      rootAdminEmail && req.user?.email?.trim().toLowerCase() === rootAdminEmail,
    );

    if (!req.user || (req.user.role !== AdminRole.SUPER_ADMIN && !isConfiguredRootAdmin)) {
      next(new AppError('Forbidden: Super admin access required', 403));
      return;
    }

    next();
  });
};
