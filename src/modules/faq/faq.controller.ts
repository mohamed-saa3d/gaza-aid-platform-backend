import type { ParsedQs } from 'qs';
import type { RequestHandler } from 'express';
import { AppError } from '../../shared/errors/app-error';
import { faqService } from './faq.service';
import { redisService } from '../../shared/services/redis.service';
import logger from '../../shared/utils/logger';
import { isMongoObjectId } from '../../shared/utils/object-id';
import { parseLimit, parsePage } from '../../shared/utils/pagination';

export const getFaqs: RequestHandler = async (req, res, next) => {
  try {
    const page = parsePage(req.query.page, 1);
    const limit = parseLimit(req.query.limit, 10);
    const result = await faqService.getFaqs(page, limit);

    res.status(200).json({
      success: true,
      message: 'FAQs fetched successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getFaq: RequestHandler = async (req, res, next) => {
  try {
    const id = String(req.params.id);

    if (!isMongoObjectId(id)) {
      throw new AppError('Invalid FAQ ID', 400);
    }

    const faq = await faqService.getFaqById(id);

    res.status(200).json({
      success: true,
      message: 'FAQ fetched successfully',
      data: faq,
    });
  } catch (error) {
    next(error);
  }
};

export const createFaq: RequestHandler = async (req, res, next) => {
  try {
    const faq = await faqService.createFaq(req.body);

    try {
      await redisService.clearCachePattern('faq*');
    } catch (err) {
      logger.warn('Failed to clear faq cache after create', err);
    }

    res.status(201).json({
      success: true,
      message: 'FAQ created successfully',
      data: faq,
    });
  } catch (error) {
    next(error);
  }
};

export const updateFaq: RequestHandler = async (req, res, next) => {
  try {
    const id = String(req.params.id);

    if (!isMongoObjectId(id)) {
      throw new AppError('Invalid FAQ ID', 400);
    }

    const faq = await faqService.updateFaq({ id, ...req.body });

    try {
      await redisService.clearCachePattern('faq*');
    } catch (err) {
      logger.warn('Failed to clear faq cache after update', err);
    }

    res.status(200).json({
      success: true,
      message: 'FAQ updated successfully',
      data: faq,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteFaq: RequestHandler = async (req, res, next) => {
  try {
    const id = String(req.params.id);

    if (!isMongoObjectId(id)) {
      throw new AppError('Invalid FAQ ID', 400);
    }

    await faqService.deleteFaq(id);

    try {
      await redisService.clearCachePattern('faq*');
    } catch (err) {
      logger.warn('Failed to clear faq cache after delete', err);
    }

    res.status(200).json({
      success: true,
      message: 'FAQ deleted successfully',
      data: { id },
    });
  } catch (error) {
    next(error);
  }
};
