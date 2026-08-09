import nodemailer from 'nodemailer';
import { env } from '../../../config/env';

const isPlaceholderValue = (value?: string): boolean => {
  if (!value) {
    return true;
  }

  const normalized = value.trim().toLowerCase();
  return [
    'your_',
    'example.com',
    'example',
    'changeme',
    'default',
  ].some((pattern) => normalized.includes(pattern));
};

export const smtpConfigured =
  !isPlaceholderValue(env.SMTP_HOST) &&
  !isPlaceholderValue(env.SMTP_USER) &&
  !isPlaceholderValue(env.SMTP_PASS) &&
  !isPlaceholderValue(env.FROM_EMAIL);

export const transport = smtpConfigured
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    })
  : null;

if (!smtpConfigured) {
  console.warn(
    '[EmailService] SMTP not fully configured. Running in Mock/Console mode for development.',
  );
}
