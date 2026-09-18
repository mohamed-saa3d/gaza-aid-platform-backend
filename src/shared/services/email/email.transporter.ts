import { Resend } from 'resend';
import { env } from '../../../config/env';

export const resend = new Resend(process.env.RESEND_API_KEY);
export const resendConfigured = Boolean(env.RESEND_API_KEY);
