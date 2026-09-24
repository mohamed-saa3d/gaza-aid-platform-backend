import type { Prisma } from '@prisma/client';

export const userSelect = {
  id: true,
  name: true,
  email: true,
  avatar: true,
  avatarPublicId: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;
