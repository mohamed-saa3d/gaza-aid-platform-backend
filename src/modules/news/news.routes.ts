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
import {
  createNewsSchema,
  updateNewsSchema,
} from './news.validation';

export const newsRoutes = Router();

newsRoutes.get('/', getNewsList);
newsRoutes.get('/:id', getNews);
newsRoutes.post('/', requireAdmin, uploadSingleImage('image'), validateRequest(createNewsSchema), createNews);
newsRoutes.put('/:id', requireAdmin, uploadSingleImage('image'), validateRequest(updateNewsSchema), updateNews);
newsRoutes.delete('/:id', requireAdmin, deleteNews);
