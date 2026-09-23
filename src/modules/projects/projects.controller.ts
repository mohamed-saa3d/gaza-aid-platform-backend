import type { ParsedQs } from 'qs';
import type { RequestHandler } from 'express';
import { ProjectStatus } from '@prisma/client';
import { projectsService } from './projects.service';
import { cloudinaryService } from '../../shared/services/cloudinary.service';
import { redisService } from '../../shared/services/redis.service';
import logger from '../../shared/utils/logger';
import { AppError } from '../../shared/errors/app-error';
import { isMongoObjectId } from '../../shared/utils/object-id';

const getStringValue = (value: string | string[] | ParsedQs | ParsedQs[] | (string | ParsedQs)[] | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }

  return Array.isArray(value) ? String(value[0]) : String(value);
};

const toNumber = (value: string | string[] | ParsedQs | ParsedQs[] | (string | ParsedQs)[] | undefined, fallback: number): number => {
  const stringValue = getStringValue(value);

  if (!stringValue) {
    return fallback;
  }

  const parsed = Number(stringValue);
  return Number.isNaN(parsed) || parsed <= 0 ? fallback : parsed;
};

const parseStatus = (value: string | string[] | ParsedQs | ParsedQs[] | (string | ParsedQs)[] | undefined): ProjectStatus | 'ALL' | undefined => {
  const statusValue = getStringValue(value);
  if (!statusValue) {
    return undefined;
  }

  const normalized = statusValue.trim().toUpperCase();

  if (normalized === 'ALL') {
    return 'ALL';
  }

  if (Object.values(ProjectStatus).includes(normalized as ProjectStatus)) {
    return normalized as ProjectStatus;
  }

  throw new AppError('Invalid project status filter', 400);
};

const parseCategoryId = (value: string | string[] | ParsedQs | ParsedQs[] | (string | ParsedQs)[] | undefined): string | undefined => {
  const categoryId = getStringValue(value)?.trim();

  if (!categoryId || categoryId === 'ALL' || categoryId === 'all') {
    return undefined;
  }

  if (!isMongoObjectId(categoryId)) {
    throw new AppError('Invalid category filter', 400);
  }

  return categoryId;
};

export const getProjects: RequestHandler = async (req, res, next) => {
  try {
    const page = toNumber(req.query.page, 1);
    const limit = toNumber(req.query.limit, 10);
    const status = parseStatus(req.query.status);
    const categoryId = parseCategoryId(req.query.categoryId);

    const result = await projectsService.getProjects(page, limit, status, categoryId, req.locale);

    res.status(200).json({
      success: true,
      message: 'Projects fetched successfully',
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

export const getProject: RequestHandler = async (req, res, next) => {
  try {
    const id = String(req.params.id);

    if (!isMongoObjectId(id)) {
      throw new AppError('Invalid project ID', 400);
    }

    const project = await projectsService.getProjectById(id, req.locale);

    res.status(200).json({
      success: true,
      message: 'Project fetched successfully',
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

export const createProject: RequestHandler = async (req, res, next) => {
  try {
    const { collectedAmount, raisedAmount, ...projectPayload } = req.body as any;

    // handle file upload if present
    if (req.file && req.file.buffer) {
      const uploadResult = await cloudinaryService.uploadImageStream(req.file.buffer, 'qaza/projects');
      projectPayload.imgUrl = uploadResult.secure_url;
      projectPayload.imgPublicId = uploadResult.public_id;
    }

    const project = await projectsService.createProject(projectPayload);

    // hard clear public project cache entries immediately after create
    try {
      await redisService.clearCache('projects');
    } catch (cacheError) {
      logger.error('[Redis] Failed to invalidate projects cache after create', cacheError);
    }

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProject: RequestHandler = async (req, res, next) => {
  try {
    const id = String(req.params.id);

    if (!isMongoObjectId(id)) {
      throw new AppError('Invalid project ID', 400);
    }

    const { collectedAmount, raisedAmount, ...projectPayload } = req.body as any;

    if (req.file && req.file.buffer) {
      // fetch existing project's public id to delete previous image
      const existingPublicId = await projectsService.getProjectPublicId(id);
      if (existingPublicId) {
        try {
          await cloudinaryService.deleteImage(existingPublicId);
        } catch (err) {
          logger.warn('Failed to delete previous Cloudinary image', err);
        }
      }

      const uploadResult = await cloudinaryService.uploadImageStream(req.file.buffer, 'qaza/projects');
      projectPayload.imgUrl = uploadResult.secure_url;
      projectPayload.imgPublicId = uploadResult.public_id;
    }

    const project = await projectsService.updateProject({ id, ...projectPayload });

    // hard clear public project cache entries immediately after update
    try {
      await redisService.clearCache('projects');
    } catch (cacheError) {
      logger.error('[Redis] Failed to invalidate projects cache after update', cacheError);
    }

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectStats: RequestHandler = async (_req, res, next) => {
  try {
    const stats = await projectsService.getProjectStats();

    res.status(200).json({
      success: true,
      message: 'Project stats fetched successfully',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectHistory: RequestHandler = async (req, res, next) => {
  try {
    const months = toNumber(req.query.months, 12);
    const history = await projectsService.getProjectHistory(months);

    res.status(200).json({
      success: true,
      message: 'Project history fetched successfully',
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Categories that still own live projects, for the public filter bar.
 * Deliberately public: it only exposes id + localized names of categories that
 * are already reachable through the public category listing.
 */
export const getProjectCategories: RequestHandler = async (req, res, next) => {
  try {
    const categories = await projectsService.getPopulatedCategories(req.locale);

    res.status(200).json({
      success: true,
      message: 'Project categories fetched successfully',
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProject: RequestHandler = async (req, res, next) => {
  try {
    const id = String(req.params.id);

    if (!isMongoObjectId(id)) {
      throw new AppError('Invalid project ID', 400);
    }

    const result = await projectsService.deleteProject(id);

    try {
      await redisService.clearCache('projects');
    } catch (cacheError) {
      logger.error('[Redis] Failed to invalidate projects cache after delete', cacheError);
    }

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
