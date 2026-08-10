import { z } from 'zod';

export const updateSettingsSchema = z.object({
  body: z.object({
    siteNameAr: z.string().trim().min(2).optional(),
    siteNameEn: z.string().trim().min(2).optional(),
    aboutUsTextAr: z.string().trim().min(10).optional(),
    aboutUsTextEn: z.string().trim().min(10).optional(),
    logoUrl: z.string().trim().url('Invalid logo URL').optional(),
    aboutUsImageUrl: z.string().trim().url('Invalid image URL').optional(),
    contactPhone: z.string().trim().optional(),
    contactEmail: z.string().trim().email('Invalid email address').optional(),
    totalBeneficiaries: z.number().int().nonnegative().optional(),
    foodBaskets: z.number().int().nonnegative().optional(),
    yearsOfGiving: z.number().int().nonnegative().optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  }),
});
