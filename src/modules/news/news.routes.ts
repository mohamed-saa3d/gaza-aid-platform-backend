import { Router } from 'express';
import { requireAdmin } from '../../shared/authorization';
import { validateRequest } from '../../shared/middlewares/validate.middleware';
import { uploadSingleImage } from '../../shared/middlewares/upload.middleware';
import {
  createNews,
  deleteNews,
  getNews,
  getNewsList,
  updateNews,
} from './news.controller';
import { useCache } from '../../shared/middlewares/cache.middleware';
import {
  createNewsSchema,
  updateNewsSchema,
} from './news.validation';

export const newsRoutes = Router();

newsRoutes.get('/', useCache('news', 1800), getNewsList);
newsRoutes.get('/:id', useCache('news', 1800), getNews);
newsRoutes.post('/', requireAdmin, uploadSingleImage('image'), validateRequest(createNewsSchema), createNews);
newsRoutes.put('/:id', requireAdmin, uploadSingleImage('image'), validateRequest(updateNewsSchema), updateNews);
newsRoutes.delete('/:id', requireAdmin, deleteNews);
