import { z } from 'zod';

export const submitRatingSchema = z.object({
  body: z
    .object({
      /**
       * Star rating. Coerced so a form encoded as string ("4") is still accepted,
       * but the integer + 1..5 bounds are enforced strictly afterwards.
       */
      value: z.coerce
        .number()
        .int('Rating must be a whole number')
        .min(1, 'Rating must be at least 1')
        .max(5, 'Rating must be at most 5'),
      comment: z.string().trim().max(1000, 'Comment is too long').optional(),
    })
    .strict(),
});

export type SubmitRatingInput = z.infer<typeof submitRatingSchema>['body'];

export type RatingViewer = {
  /** Set when an authenticated user submits. */
  userId?: string | null;
  /** Stable per-visitor key for guests (derived server-side, never PII). */
  guestKey?: string | null;
};

export type RatingAggregate = {
  average: number;
  totalRatings: number;
  /**
   * True when the requesting viewer has already rated, so the UI can render the
   * "you rated N stars" state instead of inviting a duplicate submission.
   */
  hasRated: boolean;
  /** The viewer's own score, when they have rated. */
  viewerRating: number | null;
};
