import { AppError } from '../../shared/errors/app-error';
import { prisma } from '../../shared/database/prisma';
import type { WalletDepositInput, WalletWithdrawInput } from './wallet.types';
import { DEFAULT_WALLET_CURRENCY, walletSelect, walletTransactionSelect } from './wallet.constants';
import {
  WalletStatus,
  WalletTransactionStatus,
  WalletTransactionType,
} from '@prisma/client';

type ProcessTransactionInput = {
  userId: string;
  amount: number;
  type: WalletTransactionType;
  currency?: string;
  referenceId?: string;
};

export const walletService = {
  async getWallet(userId: string) {
    return prisma.wallet.upsert({
      where: { userId },
      create: {
        user: { connect: { id: userId } },
        balance: 0,
        currency: DEFAULT_WALLET_CURRENCY,
        status: WalletStatus.ACTIVE,
      },
      update: {},
      select: walletSelect,
    });
  },

  async getWalletTransactions(userId: string, page: number, limit: number) {
    const wallet = await this.getWallet(userId);

    return prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      select: walletTransactionSelect,
      orderBy: { createdAt: 'desc' },
      skip: (Math.max(page, 1) - 1) * Math.max(limit, 1),
      take: Math.max(limit, 1),
    });
  },

  async processTransaction(input: ProcessTransactionInput) {
    const wallet = await this.getWallet(input.userId);

    const absoluteAmount = Math.abs(input.amount);
    const isWithdrawal = input.amount < 0;

    return prisma.$transaction(async (tx) => {
      const transaction = await tx.walletTransaction.create({
        data: {
          wallet: { connect: { id: wallet.id } },
          amount: input.amount,
          type: input.type,
          status: WalletTransactionStatus.PENDING,
          referenceId: input.referenceId,
        },
        select: walletTransactionSelect,
      });

      if (isWithdrawal) {
        const updateCount = await tx.wallet.updateMany({
          where: {
            id: wallet.id,
            balance: { gte: absoluteAmount },
          },
          data: {
            balance: { decrement: absoluteAmount },
          },
        });

        if (updateCount.count === 0) {
          throw new AppError('Insufficient wallet balance', 400);
        }
      } else {
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: { increment: absoluteAmount },
            currency: input.currency ?? wallet.currency,
          },
        });
      }

      await tx.walletTransaction.update({
        where: { id: transaction.id },
        data: { status: WalletTransactionStatus.SUCCESS },
      });

      return transaction;
    });
  },
};
