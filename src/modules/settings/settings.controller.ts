import type { RequestHandler } from 'express';
import { AppError } from '../../shared/errors/app-error';
import { settingsService } from './settings.service';
import { redisService } from '../../shared/services/redis.service';
import logger from '../../shared/utils/logger';

export const getSettings: RequestHandler = async (_req, res, next) => {
  try {
    const settings = await settingsService.getSettings();

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
