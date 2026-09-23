import { Prisma } from '@prisma/client';
import { prisma } from '../../shared/database/prisma';
import { AppError } from '../../shared/errors/app-error';
import { isPrismaKnownRequestError } from '../../shared/utils/prisma-error';
import { faqSelect } from './faq.constants';
import { pickLocalized, type ContentLocale } from '../../shared/middlewares/locale.middleware';
import type { CreateFaqInput, UpdateFaqInput } from './faq.types';

/** Adds locale-resolved `question`/`answer` alongside the raw AR/EN fields. */
const withLocalizedFields = <
  T extends {
    questionAr?: string | null;
    questionEn?: string | null;
    answerAr?: string | null;
    answerEn?: string | null;
  },
>(
  faq: T,
  locale: ContentLocale,
) => ({
  ...faq,
  question: pickLocalized(locale, faq.questionAr, faq.questionEn),
  answer: pickLocalized(locale, faq.answerAr, faq.answerEn),
});

export const faqService = {
  async getFaqs(page = 1, limit = 10, locale: ContentLocale = 'ar') {
    const where = { isActive: true };
    const [total, faqs] = await Promise.all([
      prisma.fAQ.count({ where }),
      prisma.fAQ.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: faqSelect,
      }),
    ]);

    return { data: faqs.map((faq) => withLocalizedFields(faq, locale)), total, page, limit };
  },

  async getFaqById(id: string, locale: ContentLocale = 'ar') {
    const faq = await prisma.fAQ.findUnique({
      where: { id },
      select: faqSelect,
    });

    if (!faq) {
      throw new AppError('FAQ was not found', 404);
    }

    return withLocalizedFields(faq, locale);
  },

  async createFaq(input: CreateFaqInput) {
    return prisma.fAQ.create({
      data: {
        questionAr: input.questionAr.trim(),
        questionEn: input.questionEn.trim(),
        answerAr: input.answerAr.trim(),
        answerEn: input.answerEn.trim(),
        isActive: input.isActive ?? true,
      },
      select: faqSelect,
    });
  },

  async updateFaq(input: UpdateFaqInput) {
    try {
      return await prisma.fAQ.update({
        where: { id: input.id },
        data: {
          ...(input.questionAr !== undefined ? { questionAr: input.questionAr.trim() } : {}),
          ...(input.questionEn !== undefined ? { questionEn: input.questionEn.trim() } : {}),
          ...(input.answerAr !== undefined ? { answerAr: input.answerAr.trim() } : {}),
          ...(input.answerEn !== undefined ? { answerEn: input.answerEn.trim() } : {}),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        },
        select: faqSelect,
      });
    } catch (error) {
      if (isPrismaKnownRequestError(error, 'P2025')) {
        throw new AppError('FAQ was not found', 404);
      }

      throw error;
    }
  },

  async deleteFaq(id: string) {
    try {
      await prisma.fAQ.delete({ where: { id } });
    } catch (error) {
      if (isPrismaKnownRequestError(error, 'P2025')) {
        throw new AppError('FAQ was not found', 404);
      }

      throw error;
    }
  },
};
