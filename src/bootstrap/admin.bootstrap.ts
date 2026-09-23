import bcrypt from 'bcryptjs';
import { AdminRole, Prisma } from '@prisma/client';
import { prisma } from '../shared/database/prisma';
import logger from '../shared/utils/logger';

const PASSWORD_SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const seedAdmin = async (): Promise<void> => {
  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be configured to seed the admin user.');
  }

  const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);

  try {
    await prisma.admin.upsert({
      where: { email: normalizeEmail(email) },
      create: {
        name: 'System Administrator',
        email: normalizeEmail(email),
        passwordHash,
        role: AdminRole.ADMIN,
        isActive: true,
      },
      update: {
        passwordHash,
        role: AdminRole.ADMIN,
        isActive: true,
        deletedAt: null,
      },
    });
  } catch (error: unknown) {
    const isDatabaseConnectionError =
      error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2010';

    if (isDatabaseConnectionError) {
      logger.error(
        '[DB Seed] Fatal Error: Could not connect to MongoDB. Please check your MongoDB Atlas Network Access (IP Whitelist) or Connection String.',
      );
    } else {
      logger.error(
        `[DB Seed] Fatal Error: Could not ensure admin user in database. ${
          error instanceof Error ? error.message : 'Unknown database error.'
        }`,
      );
    }

    process.exit(1);
  }

  console.info('[DB Seed] Admin user ensured in database.');
};
