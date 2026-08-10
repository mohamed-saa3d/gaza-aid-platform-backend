import { Router } from 'express';
import { requireUser } from '../../shared/authorization';
import { validateRequest } from '../../shared/middlewares/validate.middleware';
import { submitRating, getProjectRatings } from './ratings.controller';
import { submitRatingValidation } from './ratings.validation';

export const ratingsRoutes = Router();

ratingsRoutes.post('/projects/:projectId/ratings', requireUser, validateRequest(submitRatingValidation), submitRating);
ratingsRoutes.get('/projects/:projectId/ratings', getProjectRatings);
