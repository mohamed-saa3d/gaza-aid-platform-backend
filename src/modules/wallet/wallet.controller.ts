import type { Request, RequestHandler } from 'express';
import { AppError } from '../../shared/errors/app-error';
import { requireUser } from '../../shared/authorization';
import { validateRequest } from '../../shared/middlewares/validate.middleware';
import { walletService } from './wallet.service';
import { depositWalletValidation, withdrawWalletValidation } from './wallet.validation';
import type { WalletDepositInput, WalletWithdrawInput } from './wallet.types';

const getAuthenticatedUserId = (req: Request): string => {
  if (!req.user?.id) {
    throw new AppError('Authentication is required', 401);
  }

  return req.user.id;
};

export const getMyWallet: RequestHandler = async (req, res, next) => {
  try {
    const wallet = await walletService.getWallet(getAuthenticatedUserId(req));

    res.status(200).json({
      success: true,
      message: 'Wallet fetched successfully',
      data: wallet,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyTransactions: RequestHandler = async (req, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);

    const transactions = await walletService.getWalletTransactions(getAuthenticatedUserId(req), page, limit);

    res.status(200).json({
      success: true,
      message: 'Wallet transactions fetched successfully',
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
};

export const depositToWallet: RequestHandler = async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const payload = req.body as WalletDepositInput;

    const transaction = await walletService.processTransaction({
      userId,
      amount: payload.amount,
      type: 'DEPOSIT',
      currency: payload.currency,
    });

    res.status(201).json({
      success: true,
      message: 'Deposit created successfully',
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

export const withdrawFromWallet: RequestHandler = async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const payload = req.body as WalletWithdrawInput;

    const transaction = await walletService.processTransaction({
      userId,
      amount: -Math.abs(payload.amount),
      type: 'WITHDRAWAL',
    });

    res.status(201).json({
      success: true,
      message: 'Withdrawal request created successfully',
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

export const walletController = {
  getMyWallet,
  getMyTransactions,
  depositToWallet,
  withdrawFromWallet,
};
