import type { AdminRole } from '@prisma/client';

export type CreateAdminInput = {
  name: string;
  email: string;
  password: string;
  role?: AdminRole;
};

export type UpdateAdminInput = {
  id: string;
  name?: string;
  role?: AdminRole;
};

export type AdminLoginInput = {
  email: string;
  password: string;
};
