import { Prisma } from '@prisma/client';
import { prisma } from '../../shared/database/prisma';
import type {
  BroadcastMessageInput,
  GetAllSubscribersInput,
  SubscribeInput,
} from './subscribers.types';

const subscriberSelect = {
  id: true,
  email: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.SubscriberSelect;

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const subscribersService = {
  async subscribe(input: SubscribeInput) {
    const email = normalizeEmail(input.email);
    const existingSubscriber = await prisma.subscriber.findUnique({
      where: { email },
      select: subscriberSelect,
    });

    if (existingSubscriber) {
      if (existingSubscriber.isActive) {
        return existingSubscriber;
      }

      return prisma.subscriber.update({
        where: { email },
        data: { isActive: true },
        select: subscriberSelect,
      });
    }

    try {
      return await prisma.subscriber.create({
        data: { email },
        select: subscriberSelect,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return prisma.subscriber.update({
          where: { email },
          data: { isActive: true },
          select: subscriberSelect,
        });
      }

      throw error;
    }
  },

  getSubscribersCount() {
    return prisma.subscriber.count({
      where: { isActive: true },
    });
  },

  async broadcastMessage(input: BroadcastMessageInput) {
    const subscribers = await prisma.subscriber.findMany({
      where: { isActive: true },
      select: {
        id: true,
        email: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    for (const subscriber of subscribers) {
      console.log(
        `Mock broadcast to ${subscriber.email}: ${input.subject} - ${input.message}`,
      );
    }

    return {
      targetedSubscribers: subscribers.length,
    };
  },

  async getAllSubscribers(input: GetAllSubscribersInput) {
    const skip = (input.page - 1) * input.limit;
    const where = {};

    const [subscribers, total] = await Promise.all([
      prisma.subscriber.findMany({
        where,
        select: subscriberSelect,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: input.limit,
      }),
      prisma.subscriber.count({ where }),
    ]);

    return {
      subscribers,
      meta: {
        page: input.page,
        limit: input.limit,
        total,
        totalPages: Math.ceil(total / input.limit),
      },
    };
  },
};
