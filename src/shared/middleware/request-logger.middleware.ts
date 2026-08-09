import type { RequestHandler } from 'express';

export const requestLoggerMiddleware: RequestHandler = (req, _res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`${req.method} ${req.originalUrl}`);
  }

  next();
};
