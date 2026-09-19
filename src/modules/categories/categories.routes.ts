import { Router } from 'express';
import { requireAdmin } from '../../shared/authorization';
import { validateRequest } from '../../shared/middlewares/validate.middleware';
import { useCache } from '../../shared/middlewares/cache.middleware';
import {
  categoryIdParamSchema,
  categoriesQuerySchema,
  createCategorySchema,
  updateCategorySchema,
} from './categories.validation';
import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategoryById,
  updateCategory,
} from './categories.controller';

export const categoriesRoutes = Router();

categoriesRoutes.get(
  '/',
  useCache('categories', 3600),
  validateRequest(categoriesQuerySchema),
  getCategories,
);
categoriesRoutes.get(
  '/:id',
  useCache('categories', 3600),
  validateRequest(categoryIdParamSchema),
  getCategoryById,
);
categoriesRoutes.post('/', requireAdmin, validateRequest(createCategorySchema), createCategory);
categoriesRoutes.put(
  '/:id',
  requireAdmin,
  validateRequest(categoryIdParamSchema),
  validateRequest(updateCategorySchema),
  updateCategory,
);
categoriesRoutes.delete(
  '/:id',
  requireAdmin,
  validateRequest(categoryIdParamSchema),
  deleteCategory,
);
