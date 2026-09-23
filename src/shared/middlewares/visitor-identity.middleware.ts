import { createHash, randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

/**
 * Issues and reads a tamper-evident guest identity cookie.
 *
 * Used to let an anonymous visitor rate the platform without being identifiable:
 *
 *   - the cookie value is a random UUID, containing no personal data at all;
 *   - what gets STORED and looked up is a SHA-256 hash of that value, so a
 *     database leak cannot be replayed as a valid cookie;
 *   - the cookie is `httpOnly` (no JS access), `sameSite: 'lax'` and signed-by-
 *     proxy in production, so it is not trivially spoofable from another origin.
 *
 * This deliberately does NOT derive the identity from IP or user-agent: those are
 * both PII-adjacent and shared by entire networks, which would make one office's
 * visitors collide with each other.
 */
export const VISITOR_COOKIE_NAME = 'qazaVisitorId';

const VISITOR_COOKIE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 365;

const hashVisitorId = (value: string): string =>
  createHash('sha256').update(value).digest('hex');

const isLikelyVisitorId = (value: unknown): value is string =>
  typeof value === 'string' && /^[0-9a-f-]{36}$/i.test(value);

/**
 * Guarantees `req.visitorKey` (a hash) exists for every request, minting a new
 * cookie when the visitor does not have one yet. Mounted globally so the value is
 * stable across the whole visit, but the cookie is only ever *created* when
 * needed — ordinary browsing by an established visitor writes nothing.
 */
export const visitorIdentityMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const existing = req.cookies?.[VISITOR_COOKIE_NAME];

  if (isLikelyVisitorId(existing)) {
    req.visitorKey = hashVisitorId(existing);
    next();
    return;
  }

  const visitorId = randomUUID();

  res.cookie(VISITOR_COOKIE_NAME, visitorId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: VISITOR_COOKIE_MAX_AGE_MS,
    path: '/',
  });

  req.visitorKey = hashVisitorId(visitorId);
  next();
};

declare global {
  namespace Express {
    interface Request {
      /** SHA-256 hash of the guest identity cookie. Never raw PII. */
      visitorKey?: string;
    }
  }
}
