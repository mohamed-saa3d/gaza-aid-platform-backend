import { z } from 'zod';

export const walletDepositSchema = z.object({
  body: z.object({
    amount: z.number().int().positive({ message: 'Amount must be a positive integer in minor units' }),
    currency: z.string().min(1, { message: 'Currency is required' }).optional(),
  }),
});

export const walletWithdrawSchema = z.object({
  body: z.object({
    amount: z.number().int().positive({ message: 'Amount must be a positive integer in minor units' }),
  }),
});

export type WalletDepositInput = z.infer<typeof walletDepositSchema>['body'];
export type WalletWithdrawInput = z.infer<typeof walletWithdrawSchema>['body'];
