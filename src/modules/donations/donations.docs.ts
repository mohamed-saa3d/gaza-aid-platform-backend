/**
 * @openapi
 * /api/donations/initialize:
 *   post:
 *     tags: [Donations]
 *     summary: Initialize a donation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, currency, projectId]
 *             properties:
 *               amount:
 *                 $ref: '#/components/schemas/MinorAmountInteger'
 *                 description: Donation amount in minor units (cents/piasters). Example 1000 = 10.00.
 *               currency:
 *                 type: string
 *                 example: EGP
 *               projectId:
 *                 type: string
 *                 example: 65f000000000000000000003
 *               userId:
 *                 type: string
 *                 example: 65f000000000000000000001
 *     responses:
 *       201:
 *         description: Donation initialized successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         description: Project or user was not found
 * /api/donations/webhook:
 *   post:
 *     tags: [Donations]
 *     summary: Process a donation payment webhook idempotently
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
 *             required: [donationId, transactionId]
 *             properties:
 *               donationId:
 *                 type: string
 *                 example: 65f000000000000000000004
 *               transactionId:
 *                 type: string
 *                 example: gateway-tx-123
 *     responses:
 *       200:
 *         description: Webhook processed successfully or idempotently acknowledged.
 *       204:
 *         description: Webhook processed successfully with no content.
 *       401:
 *         description: Missing or invalid x-webhook-signature header.
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 * /api/donations:
 *   get:
 *     tags: [Donations]
 *     summary: List donations for administrators
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { name: page, in: query, schema: { type: integer, minimum: 1, default: 1 }, example: 1 }
 *       - { name: limit, in: query, schema: { type: integer, minimum: 1, default: 10 }, example: 10 }
 *     responses:
 *       200: { description: Donations fetched successfully }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 * /api/donations/project/{projectId}:
 *   get:
 *     tags: [Donations]
 *     summary: List donations for a project
 *     parameters:
 *       - { name: projectId, in: path, required: true, schema: { type: string, pattern: '^[a-fA-F0-9]{24}$' }, example: 65f000000000000000000003 }
 *     responses:
 *       200: { description: Project donations fetched successfully }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       404: { description: Project was not found }
 */
