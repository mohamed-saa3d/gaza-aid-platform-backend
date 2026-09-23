import type { Request, RequestHandler } from 'express';
import { Role } from '@prisma/client';
import { ratingsService } from './ratings.service';
import { AppError } from '../../shared/errors/app-error';
import { pickLocalized } from '../../shared/middlewares/locale.middleware';
import type { RatingViewer, SubmitRatingInput } from './ratings.types';

/**
 * Resolves who is rating.
 *
 * IMPORTANT: only a DONOR principal maps to `userId`. Administrators live in a
 * separate `Admin` collection, so their token id is NOT a valid `User` foreign
 * key. Attributing an admin's rating to `userId` made Prisma throw P2025
 * ("No 'User' record ... for a nested connect"), i.e. a 500. An admin therefore
 * falls through to the guest-identity path, which is correct: their rating is
 * still recorded and still counted exactly once.
 */
const resolveViewer = (req: Request): RatingViewer => {
  const isDonor = req.user?.role === Role.DONOR;
  const userId = isDonor ? req.user?.id : null;

  if (userId) {
    return { userId };
  }

  if (req.visitorKey) {
    return { guestKey: req.visitorKey };
  }

  throw new AppError('A rating identity could not be established', 400);
};

/** Localized success/error copy — never hardcoded Arabic in the controller. */
const messages = {
  submit: (locale: 'ar' | 'en') =>
    locale === 'ar' ? 'تم إرسال تقييمك بنجاح' : 'Your rating was submitted successfully',
  alreadyRated: (locale: 'ar' | 'en') =>
    locale === 'ar' ? 'تم تحديث تقييمك بنجاح' : 'Your rating was updated successfully',
  aggregate: (locale: 'ar' | 'en') =>
    locale === 'ar' ? 'تم جلب تقييمات المنصة بنجاح' : 'Platform ratings fetched successfully',
};

export const submitRating: RequestHandler = async (req, res, next) => {
  try {
    const payload = req.body as SubmitRatingInput;
    const viewer = resolveViewer(req);
    const locale = req.locale ?? 'ar';

    const rating = await ratingsService.submitRating(payload, viewer);
    const aggregate = await ratingsService.getAggregate(viewer);

    res.status(200).json({
      success: true,
      message: aggregate.totalRatings > 1 ? messages.alreadyRated(locale) : messages.submit(locale),
      data: {
        // Only the viewer's own score is echoed back — never the internal id,
        // the guest key, or any other visitor's data.
        value: rating.value,
        aggregate,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Public aggregate for the home page. Returns the real database average and
 * count, plus the requesting viewer's own rating when they have one.
 */
export const getPlatformStats: RequestHandler = async (req, res, next) => {
  try {
    const locale = req.locale ?? 'ar';
    // Same rule as submission: only a DONOR maps to a `userId`. An admin token id
    // is not a User row, so it must fall through to the guest identity instead of
    // performing a lookup that can never match.
    const isDonor = req.user?.role === Role.DONOR;
    const viewer: RatingViewer = isDonor
      ? { userId: req.user!.id }
      : req.visitorKey
        ? { guestKey: req.visitorKey }
        : {};

    const aggregate = await ratingsService.getAggregate(viewer);

    res.status(200).json({
      success: true,
      message: messages.aggregate(locale),
      data: aggregate,
    });
  } catch (error) {
    next(error);
  }
};

/** Admin-only listing of submitted reviews (score/comment/date only). */
export const getPlatformRatings: RequestHandler = async (req, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);

    const ratings = await ratingsService.getPlatformRatings(page, limit);

    res.status(200).json({
      success: true,
      message: pickLocalized(
        req.locale ?? 'ar',
        'تم جلب تقييمات المنصة بنجاح',
        'Platform ratings fetched successfully',
      ),
      data: ratings,
    });
  } catch (error) {
    next(error);
  }
};
