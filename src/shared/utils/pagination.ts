import type { ParsedQs } from 'qs';

const getStringValue = (
  value: string | string[] | ParsedQs | ParsedQs[] | (string | ParsedQs)[] | undefined,
): string | undefined => {
  if (!value) {
    return undefined;
  }

  return Array.isArray(value) ? String(value[0]) : String(value);
};

export const parsePage = (
  value: string | string[] | ParsedQs | ParsedQs[] | (string | ParsedQs)[] | undefined,
  fallback = 1,
): number => {
  const stringValue = getStringValue(value);

  if (!stringValue) {
    return fallback;
  }

  const parsed = Number(stringValue);
  return Number.isNaN(parsed) || parsed <= 0 ? fallback : parsed;
};

export const parseLimit = (
  value: string | string[] | ParsedQs | ParsedQs[] | (string | ParsedQs)[] | undefined,
  fallback = 10,
): number => {
  const stringValue = getStringValue(value);

  if (!stringValue) {
    return fallback;
  }

  const parsed = Number(stringValue);
  return Number.isNaN(parsed) || parsed <= 0 ? fallback : parsed;
};
