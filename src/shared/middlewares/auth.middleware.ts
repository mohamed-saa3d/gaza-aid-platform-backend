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

type AuthScope = 'user' | 'admin';

const getAccessToken = (req: Request, scope: AuthScope): string | null => {
  const cookieToken = scope === 'admin'
    ? req.cookies?.adminAccessToken ?? null
    : req.cookies?.userAccessToken ?? null;
  const bearerToken = getBearerToken(req.headers.authorization);

  console.info('[AUTH MIDDLEWARE]', {
    correlationId: req.headers['x-correlation-id'] || 'n/a',
    method: req.method,
    route: req.originalUrl,
    scope,
    cookieNames: {
      adminAccessToken: Boolean(req.cookies?.adminAccessToken),
      userAccessToken: Boolean(req.cookies?.userAccessToken),
      hasBearer: Boolean(bearerToken),
    },
    selectedCookie: cookieToken ? 'present' : 'absent',
  });

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
  scope: AuthScope,
): void => {
  const token = getAccessToken(req, scope);

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
    return;
  }

  try {
    const decoded = verifyToken(token);
    console.info('[AUTH MIDDLEWARE] verified access token', {
      correlationId: req.headers['x-correlation-id'] || 'n/a',
      route: req.originalUrl,
      userId: decoded.id,
      role: decoded.role,
      isAdmin: Boolean(decoded.isAdmin),
      sessionId: decoded.sessionId || null,
      exp: decoded.exp,
      iat: decoded.iat,
    });
    req.user = decoded;
    next();
    return;
  } catch (error) {
    console.warn('[AUTH MIDDLEWARE] access token verification failed', {
      correlationId: req.headers['x-correlation-id'] || 'n/a',
      route: req.originalUrl,
      error: error instanceof Error ? error.message : 'unknown',
    });
    res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
    return;
  }
};

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  authenticateUser(req, res, next, 'user');
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
  }, 'user');
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
  }, 'admin');
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
  }, 'admin');
};
