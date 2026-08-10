import { AppError } from '../../shared/errors/app-error';
import { prisma } from '../../shared/database/prisma';
import type { Prisma } from '@prisma/client';
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
  async getWallet(userId: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? prisma;

    return db.wallet.upsert({
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

  async processTransaction(input: ProcessTransactionInput, tx?: Prisma.TransactionClient) {
    const db = tx ?? prisma;
    const wallet = await this.getWallet(input.userId, tx);

    const absoluteAmount = Math.abs(input.amount);
    const isWithdrawal = input.amount < 0;

    const execute = async (executor: Prisma.TransactionClient) => {
      const transaction = await executor.walletTransaction.create({
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
        const updateCount = await executor.wallet.updateMany({
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
        await executor.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: { increment: absoluteAmount },
            currency: input.currency ?? wallet.currency,
          },
        });
      }

      await executor.walletTransaction.update({
        where: { id: transaction.id },
        data: { status: WalletTransactionStatus.SUCCESS },
      });

      return transaction;
    };

    if (tx) {
      return execute(tx);
    }

    return prisma.$transaction(execute);
  },
};
