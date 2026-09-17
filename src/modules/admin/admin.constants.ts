import type { Prisma } from '@prisma/client';

export const adminSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AdminSelect;
