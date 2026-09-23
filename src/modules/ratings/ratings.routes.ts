import { Router } from 'express';
import { requireAdmin, optionalAuth } from '../../shared/authorization';
import { validateRequest } from '../../shared/middlewares/validate.middleware';
import { ratingSubmitLimiter } from '../../shared/middlewares/rate-limiter.middleware';
import { submitRating, getPlatformRatings, getPlatformStats } from './ratings.controller';
import { submitRatingValidation } from './ratings.validation';

export const ratingsRoutes = Router();

// Public aggregate: safe for unauthenticated visitors (home page rating card).
ratingsRoutes.get('/stats', getPlatformStats);

// Submission is open to guests AND authenticated users.
//  - `optionalAuth` attaches `req.user` when a valid session exists without
//    requiring one, so a logged-in visitor is attributed to their account.
//  - `ratingSubmitLimiter` throttles repeated submissions per visitor.
ratingsRoutes.post(
  '/',
  ratingSubmitLimiter,
  optionalAuth,
  validateRequest(submitRatingValidation),
  submitRating,
);

// Review listing is admin-only: it is an internal moderation view.
ratingsRoutes.get('/', requireAdmin, getPlatformRatings);
