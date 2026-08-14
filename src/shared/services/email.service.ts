import { env } from '../../config/env';
import { smtpConfigured, transport } from './email/email.transporter';
import {
  renderVerificationHtml,
  renderPasswordResetHtml,
} from './email/email.templates';

export const emailService = {
  async sendVerificationEmail(to: string, otp: string) {
    const message = {
      from: env.FROM_EMAIL,
      to,
      subject: 'Your Qaza verification OTP',
      html: renderVerificationHtml(otp),
    };

    if (!smtpConfigured || !transport) {
      console.log(
        `[Mock Email] Sent to ${to} (Subject: ${message.subject}) - Content hidden for security.`,
      );
      return;
    }

    await transport.sendMail(message);
  },

  async sendPasswordResetEmail(to: string, otp: string) {
    const message = {
      from: env.FROM_EMAIL,
      to,
      subject: 'Your Qaza password reset OTP',
      html: renderPasswordResetHtml(otp),
    };

    if (!smtpConfigured || !transport) {
      console.log(
        `[Mock Email] Sent to ${to} (Subject: ${message.subject}) - Content hidden for security.`,
      );
      return;
    }

    await transport.sendMail(message);
  },
};
