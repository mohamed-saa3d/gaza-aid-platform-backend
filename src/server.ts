import { env } from './config/env';
import { app } from './app';
import './workers';
import { seedAdmin } from './bootstrap/admin.bootstrap';

const startServer = async (): Promise<void> => {
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
