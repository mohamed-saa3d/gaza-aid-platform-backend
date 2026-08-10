import type { RequestHandler } from 'express';
import { AppError } from '../../shared/errors/app-error';
import { settingsService } from './settings.service';

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

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};
