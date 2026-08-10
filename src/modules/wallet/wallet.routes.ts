import { Router } from 'express';
import { requireUser } from '../../shared/authorization';
import { validateRequest } from '../../shared/middlewares/validate.middleware';
import {
  getMyWallet,
  getMyTransactions,
  depositToWallet,
  withdrawFromWallet,
} from './wallet.controller';
import { depositWalletValidation, withdrawWalletValidation } from './wallet.validation';

export const walletRoutes = Router();

walletRoutes.get('/me', requireUser, getMyWallet);
walletRoutes.get('/me/transactions', requireUser, getMyTransactions);
walletRoutes.post('/me/deposit', requireUser, validateRequest(depositWalletValidation), depositToWallet);
walletRoutes.post('/me/withdraw', requireUser, validateRequest(withdrawWalletValidation), withdrawFromWallet);
