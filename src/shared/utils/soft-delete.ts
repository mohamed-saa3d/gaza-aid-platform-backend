import type { Prisma } from '@prisma/client';

/**
 * Filter matching every document that has NOT been soft-deleted.
 *
 * Why the `isSet: false` branch is mandatory on MongoDB:
 * Prisma's MongoDB connector serialises an explicit `deletedAt: null` as
 * "the field is unset", so documents that literally store `deletedAt: null`
 * do NOT match `{ deletedAt: null }`. Using the strict filter alone silently
 * under-counts (and under-updates) every such record — in practice it reported
 * 0 for every live project.
 *
 * Always prefer this over a bare `{ deletedAt: null }`.
 */
export const notSoftDeleted = {
  OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
} satisfies Prisma.ProjectWhereInput | Prisma.UserWhereInput | Prisma.AdminWhereInput;