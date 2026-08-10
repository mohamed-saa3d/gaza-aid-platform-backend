export const walletSelect = {
  id: true,
  userId: true,
  balance: true,
  currency: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const walletTransactionSelect = {
  id: true,
  walletId: true,
  amount: true,
  type: true,
  status: true,
  referenceId: true,
  createdAt: true,
} as const;

export const DEFAULT_WALLET_CURRENCY = 'EGP';
