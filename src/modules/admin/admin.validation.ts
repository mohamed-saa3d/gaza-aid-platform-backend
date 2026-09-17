import { z } from 'zod';
import { AdminRole } from '@prisma/client';

export const adminLoginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').trim().toLowerCase(),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const createAdminSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address').trim().toLowerCase(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.nativeEnum(AdminRole).optional(),
    rootEmail: z.string().email('Invalid root admin email').trim().toLowerCase(),
    rootPassword: z.string().min(1, 'Root password is required'),
  }).strict(),
});

export const updateAdminSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').optional(),
    role: z.nativeEnum(AdminRole).optional(),
  }).strict().refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required to update the admin',
  }),
});
