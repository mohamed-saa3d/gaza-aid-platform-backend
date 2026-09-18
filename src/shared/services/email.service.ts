import { env } from '../../config/env';
import {
  renderVerificationHtml,
  renderPasswordResetHtml,
} from './email/email.templates';
import { emailQueue } from '../../queues/email.queue';

export const emailService = {
  async sendVerificationEmail(to: string, otp: string) {
    const message = {
      from: env.EMAIL_FROM,
      to,
      subject: 'Your Qaza verification OTP',
      html: renderVerificationHtml(otp),
    };

    await emailQueue.add('verification', message);
  },

  async sendPasswordResetEmail(to: string, otp: string) {
    const message = {
      from: env.EMAIL_FROM,
      to,
      subject: 'Your Qaza password reset OTP',
      html: renderPasswordResetHtml(otp),
    };

    await emailQueue.add('password-reset', message);
  },
};
