import { prisma } from '../../shared/database/prisma';
import { walletService } from '../wallet/wallet.service';
import type { CreateCheckoutInput } from './payments.types';
import { PaymentIntentStatus, PaymentPurpose } from '@prisma/client';
import { AppError } from '../../shared/errors/app-error';

export const paymentsService = {
  async createCheckoutSession(userId: string, input: CreateCheckoutInput) {
    const intent = await prisma.paymentIntent.create({
      data: {
        user: { connect: { id: userId } },
        amount: input.amount,
        currency: input.currency ?? 'EGP',
        status: PaymentIntentStatus.PENDING,
        purpose: input.purpose as PaymentPurpose,
        referenceId: input.referenceId,
      },
    });

    return {
      intent,
      mockCheckoutUrl: `https://mock-payments.example.com/checkout/${intent.id}`,
    };
  },

  async handleGatewayWebhook(input: { paymentIntentId: string; gatewayStatus: 'SUCCESS' | 'FAILED' }) {
    const updated = await prisma.paymentIntent.updateMany({
      where: {
        id: input.paymentIntentId,
        status: PaymentIntentStatus.PENDING,
      },
      data: {
        status: input.gatewayStatus,
      },
    });

    if (updated.count === 0) {
      return { message: 'Payment intent already processed or not found' };
    }

    if (input.gatewayStatus === 'SUCCESS') {
      const intent = await prisma.paymentIntent.findUnique({
        where: { id: input.paymentIntentId },
      });

      if (!intent) {
        throw new AppError('Payment intent not found after update', 500);
      }

      if (intent.purpose === PaymentPurpose.WALLET_FUNDING) {
        await walletService.processTransaction({
          userId: intent.userId,
          amount: intent.amount,
          type: 'DEPOSIT',
        });
      }
    }

    return { message: 'Payment webhook received and processed idempotently' };
  },
};
