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
      console.log('[EmailService] Mock verification email:');
      console.log(JSON.stringify({ ...message, otp }, null, 2));
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
      console.log('[EmailService] Mock password reset email:');
      console.log(JSON.stringify({ ...message, otp }, null, 2));
      return;
    }

    await transport.sendMail(message);
  },
};
