/**
 * @openapi
 * /api/payments/checkout:
 *   post:
 *     tags: [Payments]
 *     summary: Create a payment checkout session
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, purpose]
 *             properties:
 *               amount:
 *                 $ref: '#/components/schemas/MinorAmountInteger'
 *                 description: Amount to charge in minor units (cents/piasters). Example 2500 = 25.00.
 *               currency:
 *                 type: string
 *                 example: EGP
 *               purpose:
 *                 type: string
 *                 enum: [WALLET_FUNDING, DIRECT_DONATION]
 *               referenceId:
 *                 type: string
 *                 example: wallet-topup-123
 *     responses:
 *       201:
 *         description: Checkout session created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Referenced resource was not found
 * /api/payments/webhook:
 *   post:
 *     tags: [Payments]
 *     summary: Process a payment gateway webhook
 *     parameters:
 *       - in: header
 *         name: x-webhook-signature
 *         required: true
 *         description: HMAC-SHA256 signature formatted as t=timestamp,v1=signature
 *         schema:
 *           type: string
 *           example: t=1726155900,v1=3d4d6a5c0ce91d7a9c3d3d6d1d4a5d6f7e8a9d0b7f5a6d8d8f0d0f5c0a0b
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [paymentIntentId, gatewayStatus]
 *             properties:
 *               paymentIntentId:
 *                 type: string
 *                 example: 65f000000000000000000005
 *               gatewayStatus:
 *                 type: string
 *                 enum: [SUCCESS, FAILED]
 *     responses:
 *       200:
 *         description: Webhook processed successfully or idempotently acknowledged.
 *       204:
 *         description: Webhook processed successfully with no content.
 *       401:
 *         description: Missing or invalid x-webhook-signature header.
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
