import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { Queue } from 'bullmq';
import { prisma } from '../src/shared/database/prisma';
import { bullmqConnection } from '../src/queues/redis.connection';
import { emailQueue } from '../src/queues/email.queue';
import { env } from '../src/config/env';

const baseUrl = process.env.SMOKE_BASE_URL ?? `http://localhost:${env.PORT}`;
const browserOrigin = env.ALLOWED_ORIGINS[0] ?? 'http://localhost:3000';
const smokeClientIp = `198.51.100.${(Date.now() % 200) + 1}`;
const testEmail = `smoke-${Date.now()}@example.test`;
const testPassword = 'SmokeTestPassword123!';

const getCookie = (response: Response, cookieName = 'refreshToken'): string => {
  const setCookie = response.headers.get('set-cookie');
  assert.ok(setCookie, 'Expected a refresh token cookie');
  const cookie = setCookie
    .split(',')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${cookieName}=`));
  assert.ok(cookie, `Expected ${cookieName} cookie`);
  return cookie.split(';', 1)[0];
};

const getRefreshPayload = (cookie: string, cookieName = 'refreshToken'): { sessionId?: string } => {
  const token = cookie.slice(`${cookieName}=`.length);
  const payload = token.split('.')[1];
  assert.ok(payload, 'Expected a JWT refresh token payload');
  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
    sessionId?: string;
  };
};

const getRefreshTokenValue = (cookie: string, cookieName = 'refreshToken'): string => cookie.slice(`${cookieName}=`.length);

const hashToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

const signWebhook = (body: string): string => {
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = `${timestamp}.${body}`;
  const signature = crypto
    .createHmac('sha256', env.WEBHOOK_SIGNATURE_SECRET)
    .update(payload)
    .digest('hex');

  return `t=${timestamp},v1=${signature}`;
};

const expectStatus = async (response: Response, expected: number[], label: string) => {
  const body = await response.text();
  assert.ok(
    expected.includes(response.status),
    `${label}: expected ${expected.join(' or ')}, received ${response.status}: ${body}`,
  );

  return body;
};

const main = async () => {
  let userId: string | undefined;
  let paymentIntentId: string | undefined;
  let firstRefreshCookie: string | undefined;
  let rotatedRefreshCookie: string | undefined;
  let queue: Queue | undefined;

  try {
    const passwordHash = await bcrypt.hash(testPassword, 12);
    const user = await prisma.user.create({
      data: {
        name: 'Integration Smoke User',
        email: testEmail,
        password: passwordHash,
        isEmailVerified: true,
      },
      select: { id: true },
    });
    userId = user.id;

    const paymentIntent = await prisma.paymentIntent.create({
      data: {
        userId: user.id,
        amount: 100,
        currency: 'EGP',
        purpose: 'WALLET_FUNDING',
      },
      select: { id: true },
    });
    paymentIntentId = paymentIntent.id;

    const webhookBody = JSON.stringify({
      paymentIntentId: paymentIntent.id,
      gatewayStatus: 'SUCCESS',
    });
    const webhookResponse = await fetch(`${baseUrl}/api/payments/webhook`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-webhook-signature': signWebhook(webhookBody),
      },
      body: webhookBody,
    });
    await expectStatus(webhookResponse, [200, 204], 'valid payment webhook');

    const replayBody = JSON.stringify({
      paymentIntentId: paymentIntent.id,
      gatewayStatus: 'SUCCESS',
    });
    const replayResponse = await fetch(`${baseUrl}/api/payments/webhook`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-webhook-signature': signWebhook(replayBody),
      },
      body: replayBody,
    });
    const replayResponseBody = await expectStatus(
      replayResponse,
      [200],
      'idempotent webhook replay',
    );
    const replayResult = JSON.parse(replayResponseBody) as { message?: string };
    assert.match(replayResult.message ?? '', /already processed|not found/i);

    const invalidSignatureResponse = await fetch(`${baseUrl}/api/payments/webhook`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-webhook-signature': 't=1,v1=invalid',
      },
      body: replayBody,
    });
    await expectStatus(invalidSignatureResponse, [401], 'invalid webhook signature');

    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: browserOrigin,
        'x-forwarded-for': smokeClientIp,
      },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    await expectStatus(loginResponse, [200], 'login');
    firstRefreshCookie = getCookie(loginResponse, 'userRefreshToken');
    const refreshPayload = getRefreshPayload(firstRefreshCookie, 'userRefreshToken');
    assert.ok(refreshPayload.sessionId, 'Expected sessionId in refresh token');
    const persistedSession = await prisma.refreshSession.findUnique({
      where: { id: refreshPayload.sessionId },
      select: { id: true, revokedAt: true, tokenHash: true, expiresAt: true },
    });
    assert.ok(persistedSession && !persistedSession.revokedAt, 'Expected active persisted refresh session');
    assert.equal(
      persistedSession.tokenHash,
      hashToken(getRefreshTokenValue(firstRefreshCookie)),
      'Expected persisted refresh token hash to match the issued cookie',
    );
    assert.ok(
      persistedSession.expiresAt > new Date(),
      'Expected persisted refresh session to be unexpired',
    );

    const refreshResponse = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: { cookie: firstRefreshCookie, origin: browserOrigin },
      body: '{}',
    });
    await expectStatus(refreshResponse, [200], 'refresh rotation');
    rotatedRefreshCookie = getCookie(refreshResponse, 'userRefreshToken');

    const oldTokenResponse = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: { cookie: firstRefreshCookie, origin: browserOrigin },
      body: '{}',
    });
    await expectStatus(oldTokenResponse, [401], 'revoked old refresh token');

    const logoutResponse = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { cookie: rotatedRefreshCookie, origin: browserOrigin },
    });
    await expectStatus(logoutResponse, [204], 'logout');

    const revokedTokenResponse = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: { cookie: rotatedRefreshCookie, origin: browserOrigin },
      body: '{}',
    });
    await expectStatus(revokedTokenResponse, [401], 'revoked refresh token after logout');

    const beforeQueue = await emailQueue.getJobCounts('waiting', 'active', 'completed', 'failed');
    await emailQueue.add('smoke-email', {
      to: testEmail,
      subject: 'Smoke test email',
      html: '<p>Smoke test</p>',
    });
    const afterQueue = await emailQueue.getJobCounts('waiting', 'active', 'completed', 'failed');
    assert.ok(
      afterQueue.waiting + afterQueue.active + afterQueue.completed + afterQueue.failed >
        beforeQueue.waiting + beforeQueue.active + beforeQueue.completed + beforeQueue.failed,
      'Expected an email job to be persisted in Redis',
    );

    queue = new Queue('broadcast', { connection: bullmqConnection });
    await queue.add('smoke-broadcast', {
      subject: 'Smoke test broadcast',
      message: 'Smoke test',
    });

    console.log('Smoke tests passed: webhook, session revocation, and queue persistence.');
  } finally {
    await queue?.close();
    await emailQueue.close();
    if (paymentIntentId) {
      await prisma.paymentIntent.deleteMany({ where: { id: paymentIntentId } });
    }
    if (userId) {
      await prisma.user.deleteMany({ where: { id: userId } });
    }
    await prisma.$disconnect();
  }
};

main().catch((error) => {
  console.error('Smoke tests failed:', error);
  process.exitCode = 1;
});
