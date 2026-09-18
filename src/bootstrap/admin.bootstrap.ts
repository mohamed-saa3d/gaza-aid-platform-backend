import bcrypt from 'bcryptjs';
import { AdminRole } from '@prisma/client';
import { prisma } from '../shared/database/prisma';

const PASSWORD_SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const seedAdmin = async (): Promise<void> => {
  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be configured to seed the admin user.');
  }

  const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);

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

  console.info('[DB Seed] Admin user ensured in database.');
};
