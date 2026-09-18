import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Request } from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { swaggerSpec } from './config/swagger';
import { adminRoutes } from './modules/admin/admin.routes';
import { authRoutes } from './modules/auth/auth.routes';
import { usersRoutes } from './modules/users/users.routes';
import { projectsRoutes } from './modules/projects/projects.routes';
import { donationsRoutes } from './modules/donations/donations.routes';
import { walletRoutes } from './modules/wallet/wallet.routes';
import { paymentsRoutes } from './modules/payments/payments.routes';
import { newsRoutes } from './modules/news/news.routes';
import { faqRoutes } from './modules/faq/faq.routes';
import { liveStreamsRoutes } from './modules/live-streams/live-streams.routes';
import { subscriberRoutes } from './modules/subscribers/subscribers.routes';
import { ratingsRoutes } from './modules/ratings/ratings.routes';
import { settingsRoutes } from './modules/settings/settings.routes';
import { requestLoggerMiddleware } from './shared/middlewares/request-logger.middleware';
import { globalRateLimiter } from './shared/middlewares/rate-limiter.middleware';
import { errorMiddleware } from './shared/errors/error.middleware';

export const app = express();

app.set('trust proxy', 1);
app.use(helmet());
const browserCors = cors({
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (
      env.ALLOWED_ORIGINS.includes(origin) ||
      env.NODE_ENV === 'development' ||
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:')  
    ) {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
});

app.use((req, res, next) => {
  const isOriginlessWebhook =
    !req.headers.origin &&
    [
      '/health',
      `${env.API_PREFIX}/payments/webhook`,
      `${env.API_PREFIX}/donations/webhook`,
    ].includes(req.path);

  if (isOriginlessWebhook) {
    next();
    return;
  }

  browserCors(req, res, next);
});
app.use(
  express.json({
    verify(req, _res, buffer) {
      const request = req as Request;

      if (
        request.path === `${env.API_PREFIX}/payments/webhook` ||
        request.path === `${env.API_PREFIX}/donations/webhook`
      ) {
        request.rawBody = Buffer.from(buffer);
      }
    },
  }),
);
app.use(cookieParser());
app.use(requestLoggerMiddleware);
app.use((req, res, next) => {
  if (req.path.startsWith(`${env.API_PREFIX}/auth`)) {
    next();
    return;
  }

  globalRateLimiter(req, res, next);
});

app.get('/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'Backend is healthy' });
});

if (env.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api-docs-json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}

app.use(`${env.API_PREFIX}/admin`, adminRoutes);
app.use(`${env.API_PREFIX}/auth`, authRoutes);
app.use(`${env.API_PREFIX}/users`, usersRoutes);
app.use(`${env.API_PREFIX}/projects`, projectsRoutes);
app.use(`${env.API_PREFIX}/donations`, donationsRoutes);
app.use(`${env.API_PREFIX}/payments`, paymentsRoutes);
app.use(`${env.API_PREFIX}/wallets`, walletRoutes);
app.use(`${env.API_PREFIX}/news`, newsRoutes);
app.use(`${env.API_PREFIX}/faq`, faqRoutes);
app.use(`${env.API_PREFIX}/live-streams`, liveStreamsRoutes);
app.use(`${env.API_PREFIX}/subscribers`, subscriberRoutes);
app.use(`${env.API_PREFIX}/ratings`, ratingsRoutes);
app.use(`${env.API_PREFIX}/settings`, settingsRoutes);

app.use(errorMiddleware);
