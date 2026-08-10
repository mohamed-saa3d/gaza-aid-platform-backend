import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/app-error';
import { authenticateUser } from './authenticate';
import { Role } from '@prisma/client';

export const requireUser = (req: Request, _res: Response, next: NextFunction): void => {
  authenticateUser(req, _res, (error?: unknown) => {
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
