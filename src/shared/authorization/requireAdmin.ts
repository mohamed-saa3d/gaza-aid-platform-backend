import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/app-error';
import { authenticateUser } from './authenticate';

export const requireAdmin = (req: Request, _res: Response, next: NextFunction): void => {
  authenticateUser(req, _res, (error?: unknown) => {
    if (error) {
      next(error);
      return;
    }

    if (!req.user || req.user.isAdmin !== true) {
      next(new AppError('Forbidden: Admin access required', 403));
      return;
    }

    next();
  });
};
