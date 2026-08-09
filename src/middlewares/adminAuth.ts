import type { NextFunction, Request, RequestHandler, Response } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { AdminRole } from '@prisma/client';
import { prisma } from '../lib/prisma';

export type AuthenticatedAdmin = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
};

declare global {
  namespace Express {
    interface Request {
      admin?: AuthenticatedAdmin;
    }
  }
}

type AdminJwtPayload = JwtPayload & {
  sub: string;
  role?: AdminRole;
};

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }

  return secret;
};

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

/**
 * Verifies an admin JWT and attaches the current admin to req.admin.
 */
export const verifyAdminToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = getBearerToken(req.headers.authorization);

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authorization token is required',
      });
      return;
    }

    const payload = jwt.verify(token, getJwtSecret()) as AdminJwtPayload;

    if (!payload.sub) {
      res.status(401).json({
        success: false,
        message: 'Invalid authorization token',
      });
      return;
    }

    const admin = await prisma.admin.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!admin) {
      res.status(401).json({
        success: false,
        message: 'Admin account was not found',
      });
      return;
    }

    req.admin = admin;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Authorization token has expired',
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid authorization token',
      });
      return;
    }

    next(error);
  }
};

/**
 * Ensures a previous authentication middleware attached an admin account.
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.admin) {
    res.status(403).json({
      success: false,
      message: 'Admin access is required',
    });
    return;
  }

  next();
};

/**
 * Restricts a route to authenticated admins with one of the allowed roles.
 */
export const requireAdminRole = (...allowedRoles: AdminRole[]): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      res.status(403).json({
        success: false,
        message: 'Admin access is required',
      });
      return;
    }

    if (!allowedRoles.includes(req.admin.role)) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action',
      });
      return;
    }

    next();
  };
};
