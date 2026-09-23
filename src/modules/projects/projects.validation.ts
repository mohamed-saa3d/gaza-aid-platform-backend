import { z } from 'zod';
import { ProjectStatus } from '@prisma/client';

const mongoObjectIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ID');

export const createProjectSchema = z.object({
  body: z.object({
    titleAr: z.string().trim().min(2, 'Arabic title is required'),
    titleEn: z.string().trim().min(2, 'English title is required'),
    descriptionAr: z.string().trim().min(10, 'Arabic description is required'),
    descriptionEn: z.string().trim().min(10, 'English description is required'),
    imageUrl: z.string().trim().url('Invalid image URL').optional(),
    targetAmount: z.coerce.number().positive('Target amount must be positive'),
    collectedAmount: z.coerce.number().nonnegative('Collected amount must be non-negative').optional(),
    beneficiariesCount: z.coerce.number().int().nonnegative().optional(),
    status: z.nativeEnum(ProjectStatus),
    /**
     * Required on create. `categoryId` is nullable in the database ONLY so that
     * deleting a category can unassign its projects without deleting them; every
     * project still has to be created against a real, existing category.
     */
    categoryId: mongoObjectIdSchema,
  }).strict(),
});

export const updateProjectSchema = z.object({
  body: z.object({
    titleAr: z.string().trim().min(2).optional(),
    titleEn: z.string().trim().min(2).optional(),
    descriptionAr: z.string().trim().min(10).optional(),
    descriptionEn: z.string().trim().min(10).optional(),
    imageUrl: z.string().trim().url('Invalid image URL').optional(),
    targetAmount: z.coerce.number().positive('Target amount must be positive').optional(),
    collectedAmount: z.coerce.number().nonnegative('Collected amount must be non-negative').optional(),
    beneficiariesCount: z.coerce.number().int().nonnegative().optional(),
    status: z.nativeEnum(ProjectStatus).optional(),
    // Optional on update: omitting it keeps the current category, and an empty
    // string explicitly unassigns the project (only meaningful for a project
    // whose category was already deleted).
    categoryId: z.union([mongoObjectIdSchema, z.literal('')]).optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  }).strict(),
});
