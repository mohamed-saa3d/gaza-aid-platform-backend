import 'dotenv/config';
import { prisma } from '../src/shared/database/prisma';

const environment = process.env.NODE_ENV ?? 'development';
const DATABASE_CONNECT_TIMEOUT_MS = 10000;

if (environment === 'production') {
  throw new Error('Database reset is forbidden in production environment.');
}

const run = async () => {
  console.warn('[DB Reset] Resetting the database. This will permanently remove all data.');

  try {
    await Promise.race([
      prisma.$connect(),
      new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error(`Database connection timed out after ${DATABASE_CONNECT_TIMEOUT_MS}ms`)),
          DATABASE_CONNECT_TIMEOUT_MS,
        );
      }),
    ]);

    await prisma.$runCommandRaw({ dropDatabase: 1 });
    console.log('[DB Reset] Database dropped successfully.');
  } catch (error) {
    console.error('[DB Reset] Failed to drop database using dropDatabase command.', error);
    console.warn('[DB Reset] Attempting to clear all Prisma models instead.');

    const modelDelegates = [
      ['User', 'user'],
      ['Donation', 'donation'],
      ['Project', 'project'],
      ['Category', 'category'],
      ['PlatformRating', 'platformRating'],
      ['FAQ', 'fAQ'],
      ['News', 'news'],
      ['PlatformSettings', 'platformSettings'],
      ['Subscriber', 'subscriber'],
      ['Wallet', 'wallet'],
      ['WalletTransaction', 'walletTransaction'],
      ['LiveStream', 'liveStream'],
      ['Admin', 'admin'],
      ['AuthToken', 'authToken'],
      ['RefreshSession', 'refreshSession'],
      ['PaymentIntent', 'paymentIntent'],
    ];

    for (const [modelName, delegateName] of modelDelegates) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (prisma as any)[delegateName].deleteMany();
        console.log(`[DB Reset] Cleared ${modelName} records.`);
      } catch (clearError) {
        console.warn(`[DB Reset] Could not clear model ${modelName}:`, clearError);
      }
    }

    throw new Error('Database reset could not be completed because the database is unreachable.');
  } finally {
    await prisma.$disconnect();
  }
};

run().catch((err) => {
  console.error('[DB Reset] Unexpected error:', err);
  prisma.$disconnect().catch(() => undefined);
  process.exit(1);
});
