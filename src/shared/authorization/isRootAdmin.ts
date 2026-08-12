import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/app-error';

const getRootAdminEmail = (): string => {
  const rootAdminEmail = process.env.ADMIN_EMAIL;

  if (!rootAdminEmail) {
    throw new AppError(
      'Internal server error: Root admin email is not configured in ADMIN_EMAIL',
      500,
    );
  }

  return rootAdminEmail.toLowerCase().trim();
};

export const isRootAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    next(new AppError('Authentication token is required', 401));
    return;
  }

  const userEmail = req.user.email?.toLowerCase().trim();

  if (!userEmail) {
    next(new AppError('Authentication token is missing email claim', 401));
    return;
  }

  if (userEmail === getRootAdminEmail()) {
    next();
    return;
  }

  res.status(403).json({
    success: false,
    message:
      'Access denied: Only the primary Root Admin configured in environment can perform this action.',
  });
};
