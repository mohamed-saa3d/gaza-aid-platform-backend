import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { env } from '../../config/env';
import { AppError } from '../errors/app-error';

const SIGNATURE_HEADER = 'x-webhook-signature';
const MAX_TIMESTAMP_AGE_SECONDS = 300;

const parseSignature = (header: string): { timestamp: number; signature: string } | null => {
  const values = new Map(
    header.split(',').map((part) => {
      const [key, value] = part.split('=', 2);
      return [key?.trim(), value?.trim()];
    }),
  );
  const timestamp = Number(values.get('t'));
  const signature = values.get('v1');

  if (!Number.isSafeInteger(timestamp) || !signature || !/^[a-f\d]{64}$/i.test(signature)) {
    return null;
  }

  return { timestamp, signature };
};

export const verifyWebhookSignature = (req: Request, _res: Response, next: NextFunction): void => {
  const signatureHeader = req.get(SIGNATURE_HEADER);
  const parsedSignature = signatureHeader ? parseSignature(signatureHeader) : null;
  const rawBody = req.rawBody;

  if (!parsedSignature || !rawBody) {
    next(new AppError('Invalid webhook signature', 401));
    return;
  }

  const timestampAge = Math.abs(Math.floor(Date.now() / 1000) - parsedSignature.timestamp);

  if (timestampAge > MAX_TIMESTAMP_AGE_SECONDS) {
    next(new AppError('Expired webhook signature', 401));
    return;
  }

  const signedPayload = `${parsedSignature.timestamp}.${rawBody.toString('utf8')}`;
  const expectedSignature = crypto
    .createHmac('sha256', env.WEBHOOK_SIGNATURE_SECRET)
    .update(signedPayload)
    .digest();
  const receivedSignature = Buffer.from(parsedSignature.signature, 'hex');

  if (
    receivedSignature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(receivedSignature, expectedSignature)
  ) {
    next(new AppError('Invalid webhook signature', 401));
    return;
  }

  next();
};