import { prisma } from '../../shared/database/prisma';
import { AppError } from '../../shared/errors/app-error';
import { isPrismaKnownRequestError } from '../../shared/utils/prisma-error';
import type { CategoryQueryInput, CreateCategoryInput, UpdateCategoryInput } from './categories.types';

export const categoriesService = {
  async getCategories({ page = 1, limit = 10, search }: CategoryQueryInput = {}) {
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

    const [total, categories] = await prisma.$transaction([
      prisma.category.count({ where }),
      prisma.category.findMany({
        where,
        orderBy: { nameEn: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: categories,
      total,
      page,
      limit,
    };
  },

  async getCategoryById(id: string) {
    const category = await prisma.category.findUnique({ where: { id } });

    if (!category) {
      throw new AppError('Category was not found', 404);
    }

    return category;
  },

  async createCategory(data: CreateCategoryInput) {
    try {
      return await prisma.category.create({
        data: {
          nameAr: data.nameAr.trim(),
          nameEn: data.nameEn.trim(),
          ...(data.descriptionAr !== undefined ? { descriptionAr: data.descriptionAr.trim() } : {}),
          ...(data.descriptionEn !== undefined ? { descriptionEn: data.descriptionEn.trim() } : {}),
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

  async deleteCategory(id: string) {
    const linkedProjects = await prisma.project.count({
      where: {
        categoryId: id,
        deletedAt: null,
      },
    });

    if (linkedProjects > 0) {
      throw new AppError('Cannot delete a category linked to active projects', 409);
    }

    try {
      await prisma.category.delete({ where: { id } });
    } catch (error) {
      if (isPrismaKnownRequestError(error, 'P2025')) {
        throw new AppError('Category was not found', 404);
      }

      throw error;
    }
  },
};
