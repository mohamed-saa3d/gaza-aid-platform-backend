import { env } from '../../config/env';
import {
  renderVerificationHtml,
  renderPasswordResetHtml,
} from './email/email.templates';
import { emailQueue, emailQueueEvents } from '../../queues/email.queue';

const EMAIL_DELIVERY_TIMEOUT_MS = 15000;

export const emailService = {
  async sendVerificationEmail(to: string, otp: string) {
    const message = {
      from: env.EMAIL_FROM,
      to,
      subject: 'Your Qaza verification OTP',
      html: renderVerificationHtml(otp),
    };

    const job = await emailQueue.add('verification', message);
    await job.waitUntilFinished(emailQueueEvents, EMAIL_DELIVERY_TIMEOUT_MS);
  },

  async sendPasswordResetEmail(to: string, otp: string) {
    const message = {
      from: env.EMAIL_FROM,
      to,
      subject: 'Your Qaza password reset OTP',
      html: renderPasswordResetHtml(otp),
    };

    const job = await emailQueue.add('password-reset', message);
    await job.waitUntilFinished(emailQueueEvents, EMAIL_DELIVERY_TIMEOUT_MS);
  },
};
