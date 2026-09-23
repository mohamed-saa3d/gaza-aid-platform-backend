import type { NextFunction, Request, Response } from 'express';

/**
 * Canonical content locale contract.
 *
 * The frontend explicitly tells the backend which language it is rendering, and
 * the backend localizes its own responses. There is exactly ONE mechanism:
 *
 *   1. `?locale=ar|en`  — query parameter, wins when present.
 *   2. `X-Locale: ar|en` — header, used by clients that cannot easily add a query
 *      parameter (e.g. multipart uploads that must not touch the body).
 *
 * If neither is supplied the request falls back to `Accept-Language`, and if that
 * is absent too the request defaults to Arabic. An unsupported value is NEVER an
 * error and is never forwarded to the database layer — it degrades to the default.
 */
export const SUPPORTED_LOCALES = ['ar', 'en'] as const;

export type ContentLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: ContentLocale = 'ar';

const isSupportedLocale = (value: string): value is ContentLocale =>
  (SUPPORTED_LOCALES as readonly string[]).includes(value);

/**
 * Reads the locale from a single raw string and validates it against the
 * allow-list. Anything unrecognised resolves to `undefined` so callers can fall
 * back safely. This is the only place a locale string is ever interpreted, which
 * keeps user input from ever becoming a field name or query fragment.
 */
export const parseLocale = (raw: unknown): ContentLocale | undefined => {
  if (typeof raw !== 'string') {
    return undefined;
  }

  const normalized = raw.trim().toLowerCase();

  if (isSupportedLocale(normalized)) {
    return normalized;
  }

  // Accept region-tagged values such as `ar-SA`, `en-US`, `ar_EG`.
  const primary = normalized.split(/[-_]/)[0];

  return isSupportedLocale(primary) ? primary : undefined;
};

const resolveLocale = (req: Request): ContentLocale => {
  const fromQuery = parseLocale(req.query?.locale);

  if (fromQuery) {
    return fromQuery;
  }

  const headerValue = req.headers['x-locale'];
  const fromHeader = parseLocale(Array.isArray(headerValue) ? headerValue[0] : headerValue);

  if (fromHeader) {
    return fromHeader;
  }

  const acceptLanguage = req.headers['accept-language'];
  const fromAcceptLanguage = parseLocale(
    Array.isArray(acceptLanguage) ? acceptLanguage[0] : acceptLanguage?.split(',')[0],
  );

  return fromAcceptLanguage ?? DEFAULT_LOCALE;
};

declare global {
  namespace Express {
    interface Request {
      locale?: ContentLocale;
    }
  }
}

/** Attaches the validated request locale as `req.locale`. Never throws. */
export const localeMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  req.locale = resolveLocale(req);
  next();
};

/**
 * Maps a `{ ar, en }` pair onto the requested locale, returning the requested
 * language's value when it is non-empty and the other one only as a last resort.
 *
 * Deliberately takes explicit strings instead of a field-name prefix so that
 * caller input can never be interpolated into a property lookup.
 */
export const pickLocalized = (
  locale: ContentLocale,
  ar: string | null | undefined,
  en: string | null | undefined,
): string => {
  const primary = locale === 'ar' ? ar : en;
  const secondary = locale === 'ar' ? en : ar;

  if (primary && primary.trim()) {
    return primary;
  }

  return secondary?.trim() ?? '';
};
