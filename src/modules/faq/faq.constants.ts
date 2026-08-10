import type { Prisma } from '@prisma/client';

export const faqSelect = {
  id: true,
  questionAr: true,
  questionEn: true,
  answerAr: true,
  answerEn: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.FAQSelect;
