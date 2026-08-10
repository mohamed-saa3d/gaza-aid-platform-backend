import cookieParser from 'cookie-parser';
import express from 'express';
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
import { subscribersRoutes } from './modules/subscribers/subscribers.routes';
import { ratingsRoutes } from './modules/ratings/ratings.routes';
import { settingsRoutes } from './modules/settings/settings.routes';
import { requestLoggerMiddleware } from './shared/middlewares/request-logger.middleware';
import { errorMiddleware } from './shared/errors/error.middleware';

export const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(requestLoggerMiddleware);

app.get('/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'Backend is healthy' });
});

app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/donations', donationsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/faq', faqRoutes);
app.use('/api/live-streams', liveStreamsRoutes);
app.use('/api/subscribers', subscribersRoutes);
app.use('/api/ratings', ratingsRoutes);
app.use('/api/settings', settingsRoutes);

app.use(errorMiddleware);
