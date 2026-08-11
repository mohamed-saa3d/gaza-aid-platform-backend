/**
 * @openapi
 * /api/payments/checkout:
 *   post:
 *     tags: [Payments]
 *     summary: Create a payment checkout session
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example: { amount: 250, currency: USD, purpose: WALLET_FUNDING, referenceId: wallet-topup-123 }
 *     responses:
 *       201: { description: Checkout session created successfully }
 *       400: { description: Invalid checkout data }
 *       401: { description: Authentication is required }
 *       404: { description: Referenced resource was not found }
 * /api/payments/webhook:
 *   post:
 *     tags: [Payments]
 *     summary: Process a payment gateway webhook
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example: { paymentIntentId: 65f000000000000000000005, gatewayStatus: SUCCESS }
 *     responses:
 *       200: { description: Gateway webhook processed idempotently }
 *       400: { description: Invalid payment intent or gateway status }
 *       404: { description: Payment intent was not found }
 */
