/**
 * @openapi
 * /api/wallets/me:
 *   get:
 *     tags: [Wallet]
 *     summary: Get the authenticated user wallet
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Wallet'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Wallet was not found
 * /api/wallets/me/transactions:
 *   get:
 *     tags: [Wallet]
 *     summary: List authenticated user wallet transactions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Wallet transactions fetched successfully }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { description: Wallet was not found }
 * /api/wallets/me/deposit:
 *   post:
 *     tags: [Wallet]
 *     summary: Deposit funds into the authenticated wallet
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount:
 *                 $ref: '#/components/schemas/MinorAmountInteger'
 *                 description: Deposit amount in minor units (cents/piasters). Example 2500 = 25.00.
 *               currency:
 *                 type: string
 *                 example: EGP
 *     responses:
 *       200: { description: Wallet deposit initialized successfully }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { description: Wallet was not found }
 * /api/wallets/me/withdraw:
 *   post:
 *     tags: [Wallet]
 *     summary: Withdraw funds from the authenticated wallet
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount:
 *                 $ref: '#/components/schemas/MinorAmountInteger'
 *                 description: Withdrawal amount in minor units (cents/piasters). Example 500 = 5.00.
 *     responses:
 *       200: { description: Withdrawal completed successfully }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { description: Wallet was not found }
 */
