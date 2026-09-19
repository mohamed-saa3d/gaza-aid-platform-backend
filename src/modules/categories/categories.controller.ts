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
    const result = await categoriesService.getCategories({ page, limit, search });

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
    const category = await categoriesService.getCategoryById(req.params.id as string);

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
    await categoriesService.deleteCategory(req.params.id as string);
    await invalidateCategoriesCache();

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
};
