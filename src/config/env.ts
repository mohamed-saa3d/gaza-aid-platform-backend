import dotenv from 'dotenv';

dotenv.config();

const toNumber = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const getRequired = (key: string): string => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: toNumber(process.env.PORT, 3000),
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET ?? 'change-this-secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '15m',
  JWT_REFRESH_SECRET: getRequired('JWT_REFRESH_SECRET'),
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: toNumber(process.env.SMTP_PORT, 587),
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  FROM_EMAIL: process.env.FROM_EMAIL,
  FRONTEND_URL: process.env.FRONTEND_URL,
};
