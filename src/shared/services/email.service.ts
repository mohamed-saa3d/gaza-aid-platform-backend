import nodemailer from 'nodemailer';
import { env } from '../../config/env';

if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS || !env.FROM_EMAIL) {
  throw new Error('SMTP configuration is not fully defined in environment variables.');
}

const transport = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

const renderVerificationHtml = (token: string) => `<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; color: #333;">
    <h2>Verify your email</h2>
    <p>Thank you for creating an account with Qaza. Please verify your email address by using the link below.</p>
    <p><a href="${token}" style="display:inline-block;padding:12px 20px;background:#2f74eb;color:#fff;text-decoration:none;border-radius:6px;">Verify Email</a></p>
    <p>If the button does not work, paste the following link into your browser:</p>
    <p>${token}</p>
    <p>Regards,<br/>Qaza Support Team</p>
  </body>
</html>`;

const renderPasswordResetHtml = (token: string) => `<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; color: #333;">
    <h2>Password reset request</h2>
    <p>We received a request to reset your password. To continue, click the link below:</p>
    <p><a href="${token}" style="display:inline-block;padding:12px 20px;background:#2f74eb;color:#fff;text-decoration:none;border-radius:6px;">Reset Password</a></p>
    <p>If you did not request this, you can ignore this email.</p>
    <p>If the button does not work, paste the following link into your browser:</p>
    <p>${token}</p>
    <p>Regards,<br/>Qaza Support Team</p>
  </body>
</html>`;

export const emailService = {
  async sendVerificationEmail(to: string, token: string) {
    const verificationLink = `${process.env.FRONTEND_URL ?? 'https://example.com/verify-email'}?token=${encodeURIComponent(token)}`;

    await transport.sendMail({
      from: env.FROM_EMAIL,
      to,
      subject: 'Verify your Qaza email address',
      html: renderVerificationHtml(verificationLink),
    });
  },

  async sendPasswordResetEmail(to: string, token: string) {
    const resetLink = `${process.env.FRONTEND_URL ?? 'https://example.com/reset-password'}?token=${encodeURIComponent(token)}`;

    await transport.sendMail({
      from: env.FROM_EMAIL,
      to,
      subject: 'Reset your Qaza password',
      html: renderPasswordResetHtml(resetLink),
    });
  },
};
