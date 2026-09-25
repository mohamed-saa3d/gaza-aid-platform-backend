import { env } from './config/env';
import { app } from './app';
import { seedAdmin } from './bootstrap/admin.bootstrap';

const startServer = async (): Promise<void> => {
  // Only start BullMQ workers when NOT on a serverless platform.
  // Vercel sets VERCEL=1 automatically. Workers need a persistent
  // Redis connection and a long-running process, neither of which
  // exists in serverless functions.
  if (!process.env.VERCEL) {
  await import('./workers/index.js');
}

  await seedAdmin();

  app.listen(env.PORT, () => {
    console.log(`Server is running on port ${env.PORT}`);
    console.log(`Swagger Docs available at: http://localhost:${env.PORT}/api-docs`);
  });
};

void startServer().catch((error: unknown) => {
  console.error('[Startup] Failed to initialize the server.', error);
  process.exit(1);
});
