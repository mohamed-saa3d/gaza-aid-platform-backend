import { Router } from 'express';
import { requireUser } from '../../shared/authorization';
import { validateRequest } from '../../shared/middlewares/validate.middleware';
import { submitRating, getPlatformRatings, getPlatformStats } from './ratings.controller';
import { submitRatingValidation } from './ratings.validation';

export const ratingsRoutes = Router();

ratingsRoutes.post('/', requireUser, validateRequest(submitRatingValidation), submitRating);
ratingsRoutes.get('/', getPlatformRatings);
ratingsRoutes.get('/stats', getPlatformStats);
