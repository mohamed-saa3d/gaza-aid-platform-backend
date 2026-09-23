import { prisma } from '../../shared/database/prisma';
import { AppError } from '../../shared/errors/app-error';
import { isPrismaKnownRequestError } from '../../shared/utils/prisma-error';
import { notSoftDeleted } from '../../shared/utils/soft-delete';
import { pickLocalized, type ContentLocale } from '../../shared/middlewares/locale.middleware';
import type {
  CategoryQueryInput,
  CreateCategoryInput,
  DeleteCategoryResult,
  UpdateCategoryInput,
} from './categories.types';

/** Adds the locale-resolved `name`/`description` alongside the raw AR/EN fields. */
const withLocalizedFields = <
  T extends {
    nameAr?: string | null;
    nameEn?: string | null;
    descriptionAr?: string | null;
    descriptionEn?: string | null;
  },
>(
  category: T,
  locale: ContentLocale,
) => ({
  ...category,
  name: pickLocalized(locale, category.nameAr, category.nameEn),
  description: pickLocalized(locale, category.descriptionAr, category.descriptionEn),
});

export const categoriesService = {
  async getCategories(
    { page = 1, limit = 10, search }: CategoryQueryInput = {},
    locale: ContentLocale = 'ar',
  ) {
    const where = search
      ? {
        OR: [
          { nameAr: { contains: search, mode: 'insensitive' as const } },
          { nameEn: { contains: search, mode: 'insensitive' as const } },
          { descriptionAr: { contains: search, mode: 'insensitive' as const } },
          { descriptionEn: { contains: search, mode: 'insensitive' as const } },
        ],
      }
      : {};

    const [total, categories] = await Promise.all([
      prisma.category.count({ where }),
      prisma.category.findMany({
        where,
        // Default categories carry an explicit `order` (0-5) so the Admin's
        // intended order is preserved even if a default category is renamed.
        // Alphabetical sorting is only the tiebreaker for equal orders.
        orderBy: [{ order: 'asc' }, { nameEn: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: categories.map((category) => withLocalizedFields(category, locale)),
      total,
      page,
      limit,
    };
  },

  async getCategoryById(id: string, locale: ContentLocale = 'ar') {
    const category = await prisma.category.findUnique({ where: { id } });

    if (!category) {
      throw new AppError('Category was not found', 404);
    }

    return withLocalizedFields(category, locale);
  },

  async createCategory(data: CreateCategoryInput) {
    try {
      return await prisma.category.create({
        data: {
          nameAr: data.nameAr.trim(),
          nameEn: data.nameEn.trim(),
          ...(data.descriptionAr !== undefined ? { descriptionAr: data.descriptionAr.trim() } : {}),
          ...(data.descriptionEn !== undefined ? { descriptionEn: data.descriptionEn.trim() } : {}),
          ...(data.icon ? { icon: data.icon } : {}),
          ...(data.order !== undefined ? { order: data.order } : {}),
        },
      });
    } catch (error) {
      if (isPrismaKnownRequestError(error, 'P2002')) {
        throw new AppError('A category with this name already exists', 409);
      }

      throw error;
    }
  },

  async updateCategory(id: string, data: UpdateCategoryInput) {
    try {
      return await prisma.category.update({
        where: { id },
        data: {
          ...(data.nameAr !== undefined ? { nameAr: data.nameAr.trim() } : {}),
          ...(data.nameEn !== undefined ? { nameEn: data.nameEn.trim() } : {}),
          ...(data.descriptionAr !== undefined ? { descriptionAr: data.descriptionAr.trim() } : {}),
          ...(data.descriptionEn !== undefined ? { descriptionEn: data.descriptionEn.trim() } : {}),
          ...(data.icon !== undefined ? { icon: data.icon } : {}),
          ...(data.order !== undefined ? { order: data.order } : {}),
        },
      });
    } catch (error) {
      if (isPrismaKnownRequestError(error, 'P2002')) {
        throw new AppError('A category with this name already exists', 409);
      }

      if (isPrismaKnownRequestError(error, 'P2025')) {
        throw new AppError('Category was not found', 404);
      }

      throw error;
    }
  },

  /**
   * Deletes a category WITHOUT ever deleting its projects.
   *
   * Flow:
   *  1. Count the projects still linked to the category (soft-deleted ones are
   *     ignored). The backend is the single source of truth for this count.
   *  2. If projects exist and the request is not explicitly confirmed, abort and
   *     return `confirmation_required` so the UI can warn the admin first.
   *  3. On confirmation, unassign the projects (`categoryId = null`) and delete
   *     the category in a single transaction.
   *
   * MongoDB note: the relation is declared `onDelete: SetNull` in the schema, so
   * deleting the category itself already nulls the projects' `categoryId`. The
   * explicit `updateMany` in the transaction makes the intent observable and the
   * returned `unassignedProjectCount` authoritative. Both writes run in one
   * Prisma interactive transaction so a failure cannot leave the category gone
   * while the projects still point at it.
   */
  async deleteCategory(
    id: string,
    options: { confirmUnassignProjects?: boolean } = {},
  ): Promise<DeleteCategoryResult> {
    const category = await prisma.category.findUnique({
      where: { id },
      select: { id: true, nameAr: true, nameEn: true },
    });

    if (!category) {
      throw new AppError('Category was not found', 404);
    }

    const linkedProjects = await prisma.project.count({
      where: { categoryId: id, ...notSoftDeleted },
    });

    if (linkedProjects > 0 && options.confirmUnassignProjects !== true) {
      return {
        status: 'confirmation_required',
        code: 'CATEGORY_HAS_PROJECTS',
        categoryId: category.id,
        categoryName: category.nameAr || category.nameEn,
        linkedProjectCount: linkedProjects,
      };
    }

    try {
      const unassignedProjectCount = await prisma.$transaction(async (tx) => {
        // `categoryId` is nullable on Project (String? @db.ObjectId), so `set: null`
        // is the idiomatic Prisma form for disconnecting the relation. This is the
        // operation that makes the linked projects "Uncategorized" without ever
        // deleting them.
        const unassigned = await tx.project.updateMany({
          where: { categoryId: id },
          data: { categoryId: { set: null } },
        });

        await tx.category.delete({ where: { id } });

        return unassigned.count;
      });

      return {
        status: 'deleted',
        categoryId: category.id,
        unassignedProjectCount,
      };
    } catch (error) {
      if (isPrismaKnownRequestError(error, 'P2025')) {
        throw new AppError('Category was not found', 404);
      }

      throw error;
    }
  },
};
