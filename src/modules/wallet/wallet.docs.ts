/**
 * @openapi
 * /api/wallets/me:
 *   get:
 *     tags: [Wallets]
 *     summary: Get the authenticated user wallet
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200: { description: Wallet fetched successfully }
 *       401: { description: Authentication is required }
 *       404: { description: Wallet was not found }
 * /api/wallets/me/transactions:
 *   get:
 *     tags: [Wallets]
 *     summary: List authenticated user wallet transactions
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200: { description: Wallet transactions fetched successfully }
 *       401: { description: Authentication is required }
 *       404: { description: Wallet was not found }
 * /api/wallets/me/deposit:
 *   post:
 *     tags: [Wallets]
 *     summary: Deposit funds into the authenticated wallet
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example: { amount: 100, currency: USD }
 *     responses:
 *       200: { description: Wallet deposit initialized successfully }
 *       400: { description: Invalid deposit amount or currency }
 *       401: { description: Authentication is required }
 *       404: { description: Wallet was not found }
 * /api/wallets/me/withdraw:
 *   post:
 *     tags: [Wallets]
 *     summary: Withdraw funds from the authenticated wallet
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example: { amount: 50 }
 *     responses:
 *       200: { description: Withdrawal completed successfully }
 *       400: { description: Invalid amount or insufficient balance }
 *       401: { description: Authentication is required }
 *       404: { description: Wallet was not found }
 */
