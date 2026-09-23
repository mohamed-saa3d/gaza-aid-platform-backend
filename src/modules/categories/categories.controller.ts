import type { RequestHandler } from 'express';
import { categoriesService } from './categories.service';
import { parseLimit, parsePage } from '../../shared/utils/pagination';
import { redisService } from '../../shared/services/redis.service';
import { CATEGORIES_CACHE_KEY, DEFAULT_CATEGORIES_LIMIT, DEFAULT_CATEGORIES_PAGE } from './categories.constants';
import type { CreateCategoryInput, UpdateCategoryInput } from './categories.types';
import logger from '../../shared/utils/logger';

const invalidateCategoriesCache = async (): Promise<void> => {
  try {
    await redisService.clearCachePattern(CATEGORIES_CACHE_KEY);
  } catch (error) {
    logger.error('[Redis] Failed to invalidate categories cache', error);
  }
};

export const getAllCategories: RequestHandler = async (req, res, next) => {
  try {
    const page = parsePage(req.query.page, DEFAULT_CATEGORIES_PAGE);
    const limit = parseLimit(req.query.limit, DEFAULT_CATEGORIES_LIMIT);
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;
    const result = await categoriesService.getCategories({ page, limit, search }, req.locale);

    res.status(200).json({
      success: true,
      message: 'Categories fetched successfully',
      data: result.data,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCategories = getAllCategories;

export const getCategory: RequestHandler = async (req, res, next) => {
  try {
    const category = await categoriesService.getCategoryById(req.params.id as string, req.locale);

    res.status(200).json({
      success: true,
      message: 'Category fetched successfully',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

export const getCategoryById = getCategory;

export const createCategory: RequestHandler = async (req, res, next) => {
  try {
    const category = await categoriesService.createCategory(req.body as CreateCategoryInput);
    await redisService.clearCache('categories');
    await invalidateCategoriesCache();

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategory: RequestHandler = async (req, res, next) => {
  try {
    const category = await categoriesService.updateCategory(
      req.params.id as string,
      req.body as UpdateCategoryInput,
    );
    await redisService.clearCache('categories');
    await invalidateCategoriesCache();

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory: RequestHandler = async (req, res, next) => {
  try {
    const body = (req.body ?? {}) as { confirmUnassignProjects?: boolean };
    const result = await categoriesService.deleteCategory(req.params.id as string, {
      confirmUnassignProjects: body.confirmUnassignProjects === true,
    });

    // First attempt on a category that still owns projects: nothing was written.
    if (result.status === 'confirmation_required') {
      res.status(409).json({
        success: false,
        code: result.code,
        message:
          `This category is linked to ${result.linkedProjectCount} project(s). ` +
          'Deleting it will not delete those projects, but they will become uncategorized.',
        data: {
          categoryId: result.categoryId,
          categoryName: result.categoryName,
          linkedProjectCount: result.linkedProjectCount,
          confirmationRequired: true,
        },
      });
      return;
    }

    await redisService.clearCache('categories');
    await invalidateCategoriesCache();
    // The deleted category's projects were re-assigned, so cached project
    // listings/details no longer match the database.
    if (result.unassignedProjectCount > 0) {
      try {
        await redisService.clearCachePattern('projects*');
      } catch (error) {
        logger.error('[Redis] Failed to invalidate projects cache after category delete', error);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
      data: {
        id: result.categoryId,
        unassignedProjectCount: result.unassignedProjectCount,
      },
    });
  } catch (error) {
    next(error);
  }
};
