import { z } from 'zod';

export const updateSettingsSchema = z.object({
  body: z.object({
    aboutUsTextAr: z.string().trim().min(10).optional(),
    aboutUsTextEn: z.string().trim().min(10).optional(),
    contactPhone: z.string().trim().optional(),
    // Empty string is allowed so an admin can CLEAR the email. A non-empty value
    // must still be a valid email. Without this, clearing the field sent "" and
    // the whole save was rejected with 400, so contact details could never be
    // removed (and a simultaneous phone edit was lost with it).
    contactEmail: z.union([z.string().trim().email('Invalid email address'), z.literal('')]).optional(),
    totalBeneficiaries: z.number().int().nonnegative().optional(),
    foodBaskets: z.number().int().nonnegative().optional(),
    yearsOfGiving: z.number().int().nonnegative().optional(),
  }).strict().refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  }),
});
