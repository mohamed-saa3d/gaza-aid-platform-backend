import type { NextFunction, Request, Response } from 'express';
import { authenticateUser } from './authenticate';

export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  authenticateUser(req, _res, next);
};
