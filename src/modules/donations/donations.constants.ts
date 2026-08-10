import type { Prisma } from '@prisma/client';

export const donationSelect = {
  id: true,
  amount: true,
  currency: true,
  status: true,
  transactionId: true,
  project: {
    select: {
      id: true,
      titleAr: true,
      titleEn: true,
      status: true,
    },
  },
  user: {
    select: {
      id: true,
      name: true,
    },
  },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.DonationSelect;

export const publicDonationSelect = {
  id: true,
  amount: true,
  currency: true,
  status: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.DonationSelect;
