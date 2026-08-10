import { Prisma } from '@prisma/client';
import { prisma } from '../../shared/database/prisma';
import { AppError } from '../../shared/errors/app-error';

const faqSelect = {
  id: true,
  questionAr: true,
  questionEn: true,
  answerAr: true,
  answerEn: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.FAQSelect;

type CreateFaqInput = {
  questionAr: string;
  questionEn: string;
  answerAr: string;
  answerEn: string;
  isActive?: boolean;
};

type UpdateFaqInput = {
  id: string;
  questionAr?: string;
  questionEn?: string;
  answerAr?: string;
  answerEn?: string;
  isActive?: boolean;
};

export const faqService = {
  async getFaqs(page = 1, limit = 10) {
    const where = { isActive: true };
    const [total, faqs] = await prisma.$transaction([
      prisma.fAQ.count({ where }),
      prisma.fAQ.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: faqSelect,
      }),
    ]);

    return { data: faqs, total, page, limit };
  },

  async getFaqById(id: string) {
    const faq = await prisma.fAQ.findUnique({
      where: { id },
      select: faqSelect,
    });

    if (!faq) {
      throw new AppError('FAQ was not found', 404);
    }

    return faq;
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
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new AppError('FAQ was not found', 404);
      }

      throw error;
    }
  },

  async deleteFaq(id: string) {
    try {
      await prisma.fAQ.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new AppError('FAQ was not found', 404);
      }

      throw error;
    }
  },
};
