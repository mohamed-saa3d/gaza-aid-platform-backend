import 'dotenv/config';
import { prisma } from '../src/shared/database/prisma';

const environment = process.env.NODE_ENV ?? 'development';

if (environment === 'production') {
  throw new Error('Database reset is forbidden in production environment.');
}

const run = async () => {
  console.warn('[DB Reset] Resetting the database. This will permanently remove all data.');

  try {
    await prisma.$runCommandRaw({ dropDatabase: 1 });
    console.log('[DB Reset] Database dropped successfully.');
  } catch (error) {
    console.error('[DB Reset] Failed to drop database using dropDatabase command.', error);
    console.warn('[DB Reset] Attempting to clear all Prisma models instead.');

    const modelNames = [
      'User',
      'Donation',
      'Project',
      'PlatformRating',
      'FAQ',
      'News',
      'Settings',
      'Subscriber',
      'Wallet',
      'LiveStream',
      'Admin',
      'AuthToken',
    ];

    for (const modelName of modelNames) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (prisma as any)[modelName.toLowerCase()].deleteMany();
        console.log(`[DB Reset] Cleared ${modelName} records.`);
      } catch (clearError) {
        console.warn(`[DB Reset] Could not clear model ${modelName}:`, clearError);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
};

run().catch((err) => {
  console.error('[DB Reset] Unexpected error:', err);
  prisma.$disconnect().catch(() => undefined);
  process.exit(1);
});
