import type { ParsedQs } from 'qs';
import type { RequestHandler } from 'express';
import { AppError } from '../../shared/errors/app-error';
import { newsService } from './news.service';
import { cloudinaryService } from '../../shared/services/cloudinary.service';
import { redisService } from '../../shared/services/redis.service';
import logger from '../../shared/utils/logger';
import { isMongoObjectId } from '../../shared/utils/object-id';
import { parseLimit, parsePage } from '../../shared/utils/pagination';

export const getNewsList: RequestHandler = async (req, res, next) => {
  try {
    const page = parsePage(req.query.page, 1);
    const limit = parseLimit(req.query.limit, 10);
    const result = await newsService.getNewsList(page, limit, req.locale);

    res.status(200).json({
      success: true,
      message: 'News fetched successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getNews: RequestHandler = async (req, res, next) => {
  try {
    const id = String(req.params.id);

    if (!isMongoObjectId(id)) {
      throw new AppError('Invalid news ID', 400);
    }

    const news = await newsService.getNewsById(id, req.locale);

    res.status(200).json({
      success: true,
      message: 'News fetched successfully',
      data: news,
    });
  } catch (error) {
    next(error);
  }
};

export const createNews: RequestHandler = async (req, res, next) => {
  try {
    const payload: any = { ...req.body };

    if (req.file && (req.file as any).buffer) {
      const uploadResult = await cloudinaryService.uploadImageStream((req.file as any).buffer, 'qaza/news');
      payload.imageUrl = uploadResult.secure_url;
      payload.imgPublicId = uploadResult.public_id;
    }

    const news = await newsService.createNews(payload);

    try {
      await redisService.clearCache('news');
    } catch (cacheError) {
      logger.error('[Redis] Failed to invalidate news cache after create', cacheError);
    }

    res.status(201).json({
      success: true,
      message: 'News item created successfully',
      data: news,
    });
  } catch (error) {
    next(error);
  }
};

export const updateNews: RequestHandler = async (req, res, next) => {
  try {
    const id = String(req.params.id);

    if (!isMongoObjectId(id)) {
      throw new AppError('Invalid news ID', 400);
    }

    const payload: any = { ...req.body };

    let previousPublicId: string | null = null;
    if (req.file && (req.file as any).buffer) {
      // Upload the new image first. Deleting the old asset before the new one
      // exists leaves the DB pointing at a URL that no longer resolves if the
      // upload fails.
      const uploadResult = await cloudinaryService.uploadImageStream((req.file as any).buffer, 'qaza/news');
      payload.imageUrl = uploadResult.secure_url;
      payload.imgPublicId = uploadResult.public_id;

      // Remember the old public id; it is only removed once the DB write succeeds.
      const existing = await newsService.getNewsById(id);
      previousPublicId = (existing as any)?.imgPublicId ?? null;
    }

    const news = await newsService.updateNews({ id, ...payload });

    if (previousPublicId) {
      try {
        await cloudinaryService.deleteImage(previousPublicId);
      } catch (err) {
        logger.warn('Failed to delete previous Cloudinary image for news', err);
      }
    }

    try {
      await redisService.clearCache('news');
    } catch (cacheError) {
      logger.error('[Redis] Failed to invalidate news cache after update', cacheError);
    }

    res.status(200).json({
      success: true,
      message: 'News item updated successfully',
      data: news,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNews: RequestHandler = async (req, res, next) => {
  try {
    const id = String(req.params.id);

    if (!isMongoObjectId(id)) {
      throw new AppError('Invalid news ID', 400);
    }

    await newsService.deleteNews(id);

    try {
      await redisService.clearCache('news');
    } catch (cacheError) {
      logger.error('[Redis] Failed to invalidate news cache after delete', cacheError);
    }

    res.status(200).json({
      success: true,
      message: 'News item deleted successfully',
      data: { id },
    });
  } catch (error) {
    next(error);
  }
};
