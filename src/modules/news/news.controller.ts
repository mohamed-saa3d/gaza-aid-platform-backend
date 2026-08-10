import type { ParsedQs } from 'qs';
import type { RequestHandler } from 'express';
import { AppError } from '../../shared/errors/app-error';
import { newsService } from './news.service';
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
    const news = await newsService.createNews(req.body);

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

    const news = await newsService.updateNews({ id, ...req.body });

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
