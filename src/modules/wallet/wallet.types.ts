import { z } from 'zod';

export const walletDepositSchema = z.object({
  body: z.object({
    amount: z.number().positive({ message: 'Amount must be greater than 0' }),
    currency: z.string().min(1, { message: 'Currency is required' }).optional(),
  }),
});

export const walletWithdrawSchema = z.object({
  body: z.object({
    amount: z.number().positive({ message: 'Amount must be greater than 0' }),
  }),
});

export type WalletDepositInput = z.infer<typeof walletDepositSchema>['body'];
export type WalletWithdrawInput = z.infer<typeof walletWithdrawSchema>['body'];
