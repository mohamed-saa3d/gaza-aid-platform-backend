import { env } from '../../config/env';
import { smtpConfigured, transport } from './email/email.transporter';
import {
  renderVerificationHtml,
  renderPasswordResetHtml,
} from './email/email.templates';

export const emailService = {
  async sendVerificationEmail(to: string, token: string) {
    const verificationLink = `${process.env.FRONTEND_URL ?? 'https://example.com/verify-email'}?token=${encodeURIComponent(token)}`;
    const message = {
      from: env.FROM_EMAIL,
      to,
      subject: 'Verify your Qaza email address',
      html: renderVerificationHtml(verificationLink),
    };

    if (!smtpConfigured || !transport) {
      console.log('[EmailService] Mock verification email:');
      console.log(JSON.stringify({ ...message, verificationLink }, null, 2));
      return;
    }

    await transport.sendMail(message);
  },

  async sendPasswordResetEmail(to: string, token: string) {
    const resetLink = `${process.env.FRONTEND_URL ?? 'https://example.com/reset-password'}?token=${encodeURIComponent(token)}`;
    const message = {
      from: env.FROM_EMAIL,
      to,
      subject: 'Reset your Qaza password',
      html: renderPasswordResetHtml(resetLink),
    };

    if (!smtpConfigured || !transport) {
      console.log('[EmailService] Mock password reset email:');
      console.log(JSON.stringify({ ...message, resetLink }, null, 2));
      return;
    }

    await transport.sendMail(message);
  },
};
