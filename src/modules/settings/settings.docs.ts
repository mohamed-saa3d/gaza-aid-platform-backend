/**
 * @openapi
 * /api/settings:
 *   get:
 *     tags: [Settings]
 *     summary: Get public platform settings
 *     responses:
 *       200: { description: Settings fetched successfully }
 *       404: { description: Platform settings were not found }
 *   put:
 *     tags: [Settings]
 *     summary: Update platform settings
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example: { contactPhone: +970000, contactEmail: contact@example.com, totalBeneficiaries: 5000, yearsOfGiving: 12 }
 *     responses:
 *       200: { description: Settings updated successfully }
 *       400: { description: Invalid settings data or empty update body }
 *       401: { description: Admin authentication required }
 *       404: { description: Platform settings were not found }
 */
