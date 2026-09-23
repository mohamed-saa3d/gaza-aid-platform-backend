import { z } from 'zod';

const mongoObjectIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ID');

const categoryFields = {
  nameAr: z.string().trim().min(2, 'Arabic category name is required').max(120),
  nameEn: z.string().trim().min(2, 'English category name is required').max(120),
  descriptionAr: z.string().trim().min(2, 'Arabic category description is required').max(1000).optional(),
  descriptionEn: z.string().trim().min(2, 'English category description is required').max(1000).optional(),
};

export const categoriesQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    search: z.string().trim().max(120).optional(),
  }).optional(),
});

export const categoryIdParamSchema = z.object({
  params: z.object({ id: mongoObjectIdSchema }),
});

export const createCategorySchema = z.object({
  body: z.object(categoryFields).strict(),
});

export const updateCategorySchema = z.object({
  params: z.object({ id: mongoObjectIdSchema }),
  body: z.object(categoryFields).partial().strict().refine(
    (data) => Object.keys(data).length > 0,
    { message: 'At least one field must be provided' },
  ),
});

export const deleteCategorySchema = z.object({
  params: z.object({ id: mongoObjectIdSchema }),
  body: z
    .object({
      /**
       * Explicit admin acknowledgement that the linked projects will become
       * uncategorized. The projects themselves are never deleted.
       */
      confirmUnassignProjects: z.literal(true),
    })
    .strict()
    .optional(),
});
