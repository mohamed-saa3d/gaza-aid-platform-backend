import type { RequestHandler } from 'express';
import { type ZodType } from 'zod';

type RequestValidationSchema = ZodType<{
  body?: unknown;
  params?: unknown;
  query?: unknown;
}>;

export const validateRequest = (schema: RequestValidationSchema): RequestHandler => {
  return (req, _res, next) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      });

      if (parsed.body !== undefined) {
        req.body = parsed.body;
      }

      if (parsed.params !== undefined) {
        req.params = parsed.params as typeof req.params;
      }

      if (parsed.query !== undefined) {
        Object.assign(req.query, parsed.query);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
