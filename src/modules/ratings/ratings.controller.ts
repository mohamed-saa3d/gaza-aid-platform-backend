import type { RequestHandler } from 'express';
import { ratingsService } from './ratings.service';
import { AppError } from '../../shared/errors/app-error';
import type { SubmitRatingInput } from './ratings.types';

export const submitRating: RequestHandler = async (req, res, next) => {
  try {
    const projectId = String(req.params.projectId);
    const payload = req.body as SubmitRatingInput;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('Authentication is required', 401);
    }

    const rating = await ratingsService.submitRating(userId, projectId, payload);

    res.status(201).json({
      success: true,
      message: 'Rating submitted successfully',
      data: rating,
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectRatings: RequestHandler = async (req, res, next) => {
  try {
    const projectId = String(req.params.projectId);
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);

    const ratings = await ratingsService.getProjectRatings(projectId, page, limit);

    res.status(200).json({
      success: true,
      message: 'Project ratings fetched successfully',
      data: ratings,
    });
  } catch (error) {
    next(error);
  }
};
