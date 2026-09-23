import { prisma } from '../../shared/database/prisma';
import { AppError } from '../../shared/errors/app-error';
import type { RatingAggregate, RatingViewer, SubmitRatingInput } from './ratings.types';

export const ratingsService = {
  /**
   * Records a rating for either an authenticated user or a guest.
   *
   * The identity slot is `userId` for authenticated visitors and a hashed
   * `guestKey` for guests, and both are `@unique` in the schema. That gives:
   *   - one rating per authenticated user (upsert semantics);
   *   - one rating per guest visitor, without ever storing raw PII.
   *
   * Guests are looked up by `guestKey` and updated in place, so a returning
   * visitor changes their rating rather than inflating the count.
   */
  async submitRating(input: SubmitRatingInput, viewer: RatingViewer) {
    const comment = input.comment?.trim() || null;

    if (viewer.userId) {
      // Guard against a `userId` that does not exist in the User collection (a
      // stale token, or a principal from another collection). Prisma would
      // otherwise throw P2025 on the nested connect and surface a 500; falling
      // back to the guest identity keeps the endpoint working and still records
      // exactly one rating for this visitor.
      const userExists = await prisma.user.findUnique({
        where: { id: viewer.userId },
        select: { id: true },
      });

      if (!userExists && viewer.guestKey) {
        return prisma.platformRating.upsert({
          where: { guestKey: viewer.guestKey },
          create: { guestKey: viewer.guestKey, value: input.value, comment },
          update: { value: input.value, comment },
        });
      }

      if (!userExists) {
        throw new AppError('A rating identity could not be established', 400);
      }

      return prisma.platformRating.upsert({
        where: { userId: viewer.userId },
        create: {
          user: { connect: { id: viewer.userId } },
          value: input.value,
          comment,
        },
        update: {
          value: input.value,
          comment,
        },
      });
    }

    if (viewer.guestKey) {
      return prisma.platformRating.upsert({
        where: { guestKey: viewer.guestKey },
        create: {
          guestKey: viewer.guestKey,
          value: input.value,
          comment,
        },
        update: {
          value: input.value,
          comment,
        },
      });
    }

    // Unreachable in practice: the controller always supplies one of the two
    // identities. Kept as an explicit guard rather than an implicit assumption.
    throw new AppError('A rating identity could not be established', 400);
  },

  /**
   * Real aggregate computed by MongoDB — never a hardcoded or estimated value.
   * `average` is rounded to one decimal so the UI can render "4.7 / 5"
   * consistently, and is 0 when there are no ratings yet.
   */
  async getAggregate(viewer: RatingViewer = {}): Promise<RatingAggregate> {
    const [aggregate, viewerRating] = await Promise.all([
      prisma.platformRating.aggregate({
        _avg: { value: true },
        _count: { id: true },
      }),
      viewer.userId
        ? prisma.platformRating.findUnique({ where: { userId: viewer.userId } })
        : viewer.guestKey
          ? prisma.platformRating.findUnique({ where: { guestKey: viewer.guestKey } })
          : Promise.resolve(null),
    ]);

    const rawAverage = aggregate._avg?.value ?? 0;

    return {
      average: rawAverage === 0 ? 0 : Number(rawAverage.toFixed(1)),
      totalRatings: aggregate._count.id,
      hasRated: viewerRating !== null,
      viewerRating: viewerRating?.value ?? null,
    };
  },

  /**
   * Internal review list. Deliberately returns only the score, comment and date:
   * no user id, no email, no admin fields, and no guest key — a guest key would
   * let a caller correlate visitors.
   */
  async getPlatformRatings(page: number, limit: number) {
    return prisma.platformRating.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (Math.max(page, 1) - 1) * Math.max(limit, 1),
      take: Math.max(limit, 1),
      select: { id: true, value: true, comment: true, createdAt: true, updatedAt: true },
    });
  },

  /** @deprecated kept for the legacy stats route; prefer `getAggregate`. */
  async getPlatformStats() {
    const aggregate = await this.getAggregate();

    return {
      average: aggregate.average,
      totalRatings: aggregate.totalRatings,
    };
  },
};
