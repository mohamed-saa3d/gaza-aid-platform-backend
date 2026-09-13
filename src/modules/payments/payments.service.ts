import { prisma } from '../../shared/database/prisma';
import { walletService } from '../wallet/wallet.service';
import type { CreateCheckoutInput } from './payments.types';
import { AppError } from '../../shared/errors/app-error';
import { PaymentIntentStatus, PaymentPurpose, WalletTransactionType } from '@prisma/client';

export const paymentsService = {
  async createCheckoutSession(userId: string, input: CreateCheckoutInput) {
    const intent = await prisma.paymentIntent.create({
      data: {
        user: { connect: { id: userId } },
        amount: input.amount,
        currency: input.currency ?? 'EGP',
        status: PaymentIntentStatus.PENDING,
        purpose: input.purpose,
        referenceId: input.referenceId,
      },
    });

    return {
      intent,
      mockCheckoutUrl: `https://mock-payments.example.com/checkout/${intent.id}`,
    };
  },

  async handleGatewayWebhook(input: { paymentIntentId: string; gatewayStatus: 'SUCCESS' | 'FAILED' }) {
    const result = await prisma.$transaction(async (tx) => {
      const intent = await tx.paymentIntent.findUnique({
        where: { id: input.paymentIntentId },
      });

      if (!intent || intent.status !== PaymentIntentStatus.PENDING) {
        return { message: 'Payment intent already processed or not found' };
      }

      const updateResult = await tx.paymentIntent.updateMany({
        where: {
          id: input.paymentIntentId,
          status: PaymentIntentStatus.PENDING,
        },
        data: { status: input.gatewayStatus },
      });

      if (updateResult.count !== 1) {
        return { message: 'Payment intent already processed or not found' };
      }

      if (input.gatewayStatus === 'SUCCESS' && intent.purpose === PaymentPurpose.WALLET_FUNDING) {
        await walletService.processTransaction(
          {
            userId: intent.userId,
            amount: intent.amount,
            type: WalletTransactionType.DEPOSIT,
          },
          tx,
        );
      }

      return { message: 'Payment webhook received and processed idempotently' };
    });

    return result;
  },
};
