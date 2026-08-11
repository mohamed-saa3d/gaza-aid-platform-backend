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
 *           example: { amount: 100, currency: USD, projectId: 65f000000000000000000003, userId: 65f000000000000000000001 }
 *     responses:
 *       201: { description: Donation initialized successfully }
 *       400: { description: Invalid amount, project ID, or user ID }
 *       404: { description: Project or user was not found }
 * /api/donations/webhook:
 *   post:
 *     tags: [Donations]
 *     summary: Process a donation payment webhook idempotently
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example: { donationId: 65f000000000000000000004, transactionId: gateway-tx-123 }
 *     responses:
 *       200: { description: Payment webhook processed successfully }
 *       400: { description: Invalid donation or transaction data }
 *       404: { description: Donation was not found }
 * /api/donations:
 *   get:
 *     tags: [Donations]
 *     summary: List donations for administrators
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - { name: page, in: query, schema: { type: integer, minimum: 1, default: 1 }, example: 1 }
 *       - { name: limit, in: query, schema: { type: integer, minimum: 1, default: 10 }, example: 10 }
 *     responses:
 *       200: { description: Donations fetched successfully }
 *       401: { description: Admin authentication required }
 *       404: { description: Donations were not found }
 * /api/donations/project/{projectId}:
 *   get:
 *     tags: [Donations]
 *     summary: List donations for a project
 *     parameters:
 *       - { name: projectId, in: path, required: true, schema: { type: string, pattern: '^[a-fA-F0-9]{24}$' }, example: 65f000000000000000000003 }
 *     responses:
 *       200: { description: Project donations fetched successfully }
 *       400: { description: Invalid project ID }
 *       404: { description: Project was not found }
 */
