import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from './app-error';

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  const isProduction = process.env.NODE_ENV === 'production';

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.issues,
    });
    return;
  }

  console.error(error);

  res.status(500).json({
    success: false,
    message: isProduction ? 'Internal server error' : error.message || 'Internal server error',
    ...(!isProduction && error.stack ? { errors: { stack: error.stack } } : {}),
  });
};
