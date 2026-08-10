import { DonationStatus } from '@prisma/client';
import { prisma } from '../../shared/database/prisma';
import { AppError } from '../../shared/errors/app-error';
import { donationSelect, publicDonationSelect } from './donations.constants';

export const donationsService = {
  async initializeDonation(input: {
    amount: number;
    currency: string;
    projectId: string;
    userId?: string;
  }) {
    const project = await prisma.project.findUnique({
      where: { id: input.projectId },
      select: { id: true },
    });

    if (!project) {
      throw new AppError('Project was not found', 404);
    }

    const donation = await prisma.donation.create({
      data: {
        amount: input.amount,
        currency: input.currency.trim(),
        project: { connect: { id: input.projectId } },
        user: input.userId ? { connect: { id: input.userId } } : undefined,
        status: DonationStatus.PENDING,
      },
      select: donationSelect,
    });

    return {
      donation,
      paymentUrl: `https://mock-payment-gateway.example.com/pay?donationId=${donation.id}`,
    };
  },

  async handlePaymentWebhook(input: { donationId: string; transactionId: string }) {
    const donation = await prisma.donation.findUnique({
      where: { id: input.donationId },
      select: {
        id: true,
        status: true,
        projectId: true,
        amount: true,
      },
    });

    if (!donation) {
      throw new AppError('Donation was not found', 404);
    }

    if (donation.status === DonationStatus.SUCCESS) {
      return prisma.donation.findUnique({
        where: { id: input.donationId },
        select: donationSelect,
      });
    }

    const [updatedDonation] = await prisma.$transaction([
      prisma.donation.update({
        where: { id: input.donationId },
        data: {
          status: DonationStatus.SUCCESS,
          transactionId: input.transactionId.trim(),
        },
        select: donationSelect,
      }),
      prisma.project.update({
        where: { id: donation.projectId! },
        data: {
          collectedAmount: {
            increment: donation.amount,
          },
        },
      }),
    ]);

    return updatedDonation;
  },

  async getAllDonations(page = 1, limit = 10) {
    const [total, donations] = await prisma.$transaction([
      prisma.donation.count(),
      prisma.donation.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: donationSelect,
      }),
    ]);

    return { data: donations, total, page, limit };
  },

  async getProjectDonations(projectId: string) {
    return prisma.donation.findMany({
      where: {
        projectId,
        status: DonationStatus.SUCCESS,
      },
      orderBy: { createdAt: 'desc' },
      select: publicDonationSelect,
    });
  },
};

