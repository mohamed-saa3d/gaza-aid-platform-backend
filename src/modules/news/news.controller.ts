import type { ParsedQs } from 'qs';
import type { RequestHandler } from 'express';
import { AppError } from '../../shared/errors/app-error';
import { newsService } from './news.service';
import { cloudinaryService } from '../../shared/services/cloudinary.service';
import { isMongoObjectId } from '../../shared/utils/object-id';
import { parseLimit, parsePage } from '../../shared/utils/pagination';

export const getNewsList: RequestHandler = async (req, res, next) => {
  try {
    const page = parsePage(req.query.page, 1);
    const limit = parseLimit(req.query.limit, 10);
    const result = await newsService.getNewsList(page, limit);

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

    const news = await newsService.getNewsById(id);

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

    if (req.file && (req.file as any).buffer) {
      // get existing to delete old image
      const existing = await newsService.getNewsById(id);
      if (existing && (existing as any).imgPublicId) {
        try {
          await cloudinaryService.deleteImage((existing as any).imgPublicId);
        } catch (err) {
          // log and continue
          // eslint-disable-next-line no-console
          console.warn('Failed to delete previous Cloudinary image for news', err);
        }
      }

      const uploadResult = await cloudinaryService.uploadImageStream((req.file as any).buffer, 'qaza/news');
      payload.imageUrl = uploadResult.secure_url;
      payload.imgPublicId = uploadResult.public_id;
    }

    const news = await newsService.updateNews({ id, ...payload });

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

    res.status(200).json({
      success: true,
      message: 'News item deleted successfully',
      data: { id },
    });
  } catch (error) {
    next(error);
  }
};
