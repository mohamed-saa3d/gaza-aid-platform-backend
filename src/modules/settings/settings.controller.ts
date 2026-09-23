import type { RequestHandler } from 'express';
import { AppError } from '../../shared/errors/app-error';
import { settingsService } from './settings.service';
import { redisService } from '../../shared/services/redis.service';
import { cloudinaryService } from '../../shared/services/cloudinary.service';
import logger from '../../shared/utils/logger';

export const getSettings: RequestHandler = async (req, res, next) => {
  try {
    const settings = await settingsService.getSettings(req.locale);

    res.status(200).json({
      success: true,
      message: 'Settings fetched successfully',
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSettings: RequestHandler = async (req, res, next) => {
  try {
    const settings = await settingsService.updateSettings(req.body);
    try {
      await redisService.clearCachePattern('settings*');
    } catch (err) {
      logger.warn('Failed to clear settings cache after update', err);
    }

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Uploads the site logo to Cloudinary and stores the resulting URL in the
 * existing PlatformSettings record. Reuses the shared Cloudinary service and
 * upload middleware — there is no separate logo upload system.
 */
export const uploadSiteLogo: RequestHandler = async (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer) {
      throw new AppError('Logo image file is required', 400);
    }

    const uploadResult = await cloudinaryService.uploadImageStream(
      req.file.buffer,
      'qaza/branding',
    );

    const settings = await settingsService.updateSettings({
      logoUrl: uploadResult.secure_url,
    });

    try {
      await redisService.clearCachePattern('settings*');
    } catch (err) {
      logger.warn('Failed to clear settings cache after logo upload', err);
    }

    res.status(200).json({
      success: true,
      message: 'Site logo uploaded successfully',
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};
