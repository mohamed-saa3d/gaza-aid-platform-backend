import { ProjectStatus, type Prisma } from '@prisma/client';
import { prisma } from '../../shared/database/prisma';
import { AppError } from '../../shared/errors/app-error';
import { projectSelect } from './projects.constants';
import { cloudinaryService } from '../../shared/services/cloudinary.service';
import { notSoftDeleted } from '../../shared/utils/soft-delete';
import { pickLocalized, type ContentLocale } from '../../shared/middlewares/locale.middleware';
import type { CreateProjectInput, UpdateProjectInput } from './projects.types';

const calculateProgressPercentage = (collectedAmount: number, targetAmount: number): number => {
  if (targetAmount <= 0) {
    return 0;
  }

  return Number(((collectedAmount / targetAmount) * 100).toFixed(2));
};

const withBeneficiariesCount = <T extends { beneficiariesCount?: number | null }>(project: T) => ({
  ...project,
  beneficiariesCount: project.beneficiariesCount ?? 0,
});

const notDeletedFilter = notSoftDeleted;

/**
 * Adds the locale-resolved display fields a public response needs.
 *
 * The raw `titleAr`/`titleEn`/`descriptionAr`/`descriptionEn` fields are kept so
 * the admin dashboard keeps working against the same endpoints, while `title`,
 * `description` and `categoryName` are already in the language the visitor asked
 * for — the frontend never has to choose between the two itself.
 */
const withLocalizedFields = <
  T extends {
    titleAr?: string | null;
    titleEn?: string | null;
    descriptionAr?: string | null;
    descriptionEn?: string | null;
    category?: { nameAr?: string | null; nameEn?: string | null } | null;
  },
>(
  project: T,
  locale: ContentLocale,
) => ({
  ...project,
  title: pickLocalized(locale, project.titleAr, project.titleEn),
  description: pickLocalized(locale, project.descriptionAr, project.descriptionEn),
  categoryName: project.category
    ? pickLocalized(locale, project.category.nameAr, project.category.nameEn)
    : null,
});

export const projectsService = {
  async getProjects(
    page = 1,
    limit = 10,
    status?: ProjectStatus | 'ALL',
    categoryId?: string,
    locale: ContentLocale = 'ar',
  ) {
    const where: Prisma.ProjectWhereInput = {
      ...notDeletedFilter,
      ...(status && status !== 'ALL' ? { status } : {}),
      // Filtering is opt-in: when no category is requested (the "All" filter) the
      // clause is absent entirely, so uncategorized projects (categoryId = null,
      // e.g. after their category was deleted) stay visible alongside the rest.
      ...(categoryId ? { categoryId } : {}),
    };

    const [total, projects] = await Promise.all([
      prisma.project.count({ where }),
      prisma.project.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: projectSelect,
      }),
    ]);

    return {
      data: projects.map((project: any) => ({
        ...withBeneficiariesCount(withLocalizedFields(project, locale)),
        progressPercentage: calculateProgressPercentage(project.collectedAmount, project.targetAmount),
      })),
      total,
      page,
      limit,
    };
  },

  async getProjectById(id: string, locale: ContentLocale = 'ar') {
    const project = await prisma.project.findFirst({
      where: { id, ...notDeletedFilter },
      select: projectSelect,
    });

    if (!project) {
      throw new AppError('Project was not found', 404);
    }

    return {
      ...withBeneficiariesCount(withLocalizedFields(project, locale)),
      progressPercentage: calculateProgressPercentage(project.collectedAmount, project.targetAmount),
    };
  },

  async getProjectPublicId(id: string) {
    const proj = await prisma.project.findUnique({ where: { id }, select: { imgPublicId: true } as any });
    return (proj as any)?.imgPublicId ?? null;
  },

  /**
   * Returns the categories that still own at least one live project.
   *
   * Used by the public project filter bar so it only offers filters that can
   * actually match something — a category whose projects were all unassigned or
   * soft-deleted would otherwise render a permanently empty filter.
   */
  async getPopulatedCategories(locale: ContentLocale = 'ar') {
    const categories = await prisma.category.findMany({
      where: { projects: { some: notDeletedFilter } },
      // Default categories first (order 0-5), then the rest; `nameEn` breaks ties.
      orderBy: [{ order: 'asc' }, { nameEn: 'asc' }],
      select: { id: true, nameAr: true, nameEn: true, icon: true, order: true },
    });

    return categories.map((category) => ({
      ...category,
      name: pickLocalized(locale, category.nameAr, category.nameEn),
    }));
  },

  /**
   * Monthly project creation/completion history, derived from the real
   * `createdAt`/`updatedAt` timestamps in the Project collection.
   *
   * Returns the last `months` buckets ending with the current month, each with a
   * running `total` (projects existing by then) and `completed` (of those, the
   * ones now completed). Months with no activity are included as zeros so the
   * chart plots a continuous timeline instead of skipping gaps.
   */
  async getProjectHistory(months = 12) {
    const safeMonths = Math.min(Math.max(months, 1), 24);
    const now = new Date();

    // Month buckets, oldest first.
    const buckets: Array<{ key: string; label: string; start: Date; end: Date }> = [];
    for (let offset = safeMonths - 1; offset >= 0; offset -= 1) {
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
      const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
      buckets.push({
        key: `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, '0')}`,
        label: start.toISOString().slice(0, 7),
        start,
        end,
      });
    }

    const earliest = buckets[0].start;

    // One query for every project in range; aggregation happens in memory so the
    // result is a genuine cumulative series rather than a per-month snapshot.
    const projects = await prisma.project.findMany({
      where: { ...notDeletedFilter, createdAt: { gte: earliest } },
      select: { createdAt: true, status: true },
    });

    // Baseline: projects that existed before the window, so the running total is
    // correct rather than restarting at zero.
    const baselineTotal = await prisma.project.count({
      where: { ...notDeletedFilter, createdAt: { lt: earliest } },
    });
    const baselineCompleted = await prisma.project.count({
      where: {
        ...notDeletedFilter,
        createdAt: { lt: earliest },
        status: ProjectStatus.COMPLETED,
      },
    });

    let runningTotal = baselineTotal;
    let runningCompleted = baselineCompleted;

    return buckets.map((bucket) => {
      const inMonth = projects.filter(
        (project) => project.createdAt >= bucket.start && project.createdAt < bucket.end,
      );

      runningTotal += inMonth.length;
      runningCompleted += inMonth.filter((p) => p.status === ProjectStatus.COMPLETED).length;

      return {
        month: bucket.label,
        total: runningTotal,
        completed: runningCompleted,
      };
    });
  },

  async getProjectStats() {
    // Reuse the SAME soft-delete filter as the list query. On MongoDB, an
    // explicit `deletedAt: null` serialises to "field is unset", so records that
    // literally store `deletedAt: null` do NOT match `{ deletedAt: null }` —
    // counting with the strict filter silently reported 0 for every live project.
    const [total, completed] = await Promise.all([
      prisma.project.count({ where: notDeletedFilter }),
      prisma.project.count({
        where: { ...notDeletedFilter, status: ProjectStatus.COMPLETED },
      }),
    ]);

    return {
      totalProjects: total,
      completedProjects: completed,
      completionPercentage: total === 0 ? 0 : Number(((completed / total) * 100).toFixed(2)),
    };
  },

  /**
   * Resolves a category id to a validated, existing category.
   *
   * `categoryId` is nullable on Project so that deleting a category can safely
   * unassign its projects — but that does NOT mean an admin may create a project
   * without a category. Every project enters the system categorized; it only
   * loses its category when the category itself is deleted.
   */
  async resolveCategoryOrThrow(categoryId: string | undefined | null): Promise<string> {
    const normalized = categoryId?.trim();

    if (!normalized) {
      throw new AppError('Category is required to create a project', 400);
    }

    const category = await prisma.category.findUnique({
      where: { id: normalized },
      select: { id: true },
    });

    if (!category) {
      throw new AppError('Category was not found', 404);
    }

    return category.id;
  },

  async createProject(input: CreateProjectInput) {
    const sanitizedInput = input;

    const categoryId = await projectsService.resolveCategoryOrThrow(sanitizedInput.categoryId);

    const projectStatus = sanitizedInput.status ?? ProjectStatus.ACTIVE;

    const project = await prisma.project.create({
      data: {
        titleAr: sanitizedInput.titleAr.trim(),
        titleEn: sanitizedInput.titleEn.trim(),
        descriptionAr: sanitizedInput.descriptionAr.trim(),
        descriptionEn: sanitizedInput.descriptionEn.trim(),
        imgUrl: sanitizedInput.imgUrl,
        imgPublicId: sanitizedInput.imgPublicId,
        targetAmount: sanitizedInput.targetAmount,
        beneficiariesCount: sanitizedInput.beneficiariesCount,
        status: projectStatus,
        category: { connect: { id: categoryId } },
      } as any,
      select: projectSelect as any,
    });

    return withBeneficiariesCount(project);
  },

  async updateProject(input: UpdateProjectInput) {
    const sanitizedInput = input;

    // A category supplied on update must exist. An explicitly empty string means
    // "unassign" and is allowed, because a project may legitimately have lost its
    // category when that category was deleted.
    if (sanitizedInput.categoryId !== undefined && sanitizedInput.categoryId !== null && sanitizedInput.categoryId !== '') {
      await projectsService.resolveCategoryOrThrow(sanitizedInput.categoryId);
    }

    const existingProject = await prisma.project.findUnique({
      where: { id: sanitizedInput.id },
      select: {
        collectedAmount: true,
        targetAmount: true,
        status: true,
        updatedAt: true,
      },
    });

    if (!existingProject) {
      throw new AppError('Project was not found', 404);
    }

    const updatedTargetAmount = sanitizedInput.targetAmount ?? existingProject.targetAmount;
    const shouldComplete = existingProject.collectedAmount >= updatedTargetAmount;
    const updatedStatus = shouldComplete
      ? ProjectStatus.COMPLETED
      : sanitizedInput.status ?? existingProject.status;

    try {
      const project = await prisma.project.update({
        where: {
          id: sanitizedInput.id,
          updatedAt: existingProject.updatedAt,
        },
        data: {
          ...(sanitizedInput.titleAr ? { titleAr: sanitizedInput.titleAr.trim() } : {}),
          ...(sanitizedInput.titleEn ? { titleEn: sanitizedInput.titleEn.trim() } : {}),
          ...(sanitizedInput.descriptionAr ? { descriptionAr: sanitizedInput.descriptionAr.trim() } : {}),
          ...(sanitizedInput.descriptionEn ? { descriptionEn: sanitizedInput.descriptionEn.trim() } : {}),
          ...(sanitizedInput.imgUrl !== undefined ? { imgUrl: sanitizedInput.imgUrl } : {}),
          ...(sanitizedInput.imgPublicId !== undefined ? { imgPublicId: sanitizedInput.imgPublicId } : {}),
          ...(sanitizedInput.targetAmount !== undefined ? { targetAmount: sanitizedInput.targetAmount } : {}),
          ...(sanitizedInput.beneficiariesCount !== undefined
            ? { beneficiariesCount: sanitizedInput.beneficiariesCount }
            : {}),
          // `categoryId` is intentionally tri-state on update:
          //  - undefined -> leave the current category untouched (a normal edit);
          //  - a real id -> reassign to that (already validated) category;
          //  - ''        -> explicit unassign, which is the only way an admin can
          //                 deliberately make a project uncategorized by hand.
          ...(sanitizedInput.categoryId === ''
            ? { category: { disconnect: true } }
            : sanitizedInput.categoryId
              ? { category: { connect: { id: sanitizedInput.categoryId } } }
              : {}),
          status: updatedStatus,
        } as any,
        select: projectSelect as any,
      });

      return withBeneficiariesCount(project);
    } catch (error) {
      if (
        error instanceof AppError ||
        (error instanceof Error && error.name === 'PrismaClientKnownRequestError' &&
          (error as any).code === 'P2025')
      ) {
        throw new AppError('Project was not found or already modified during update', 409);
      }

      throw error;
    }
  },

  async deleteProject(id: string) {
    const project = await prisma.project.findUnique({
      where: { id },
      select: {
        id: true,
        collectedAmount: true,
        imgPublicId: true,
      },
    });

    if (!project) {
      throw new AppError('Project was not found', 404);
    }

    if (project.collectedAmount > 0) {
      throw new AppError('Cannot delete a project that has received donations.', 400);
    }

    await prisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // remove image from Cloudinary if present
    if (project.imgPublicId) {
      try {
        await cloudinaryService.deleteImage(project.imgPublicId);
      } catch (err) {
        // log and continue; do not fail deletion because of remote cleanup
        // eslint-disable-next-line no-console
        console.warn('Failed to delete Cloudinary image for project', project.id, err);
      }
    }

    return { id };
  },
};
