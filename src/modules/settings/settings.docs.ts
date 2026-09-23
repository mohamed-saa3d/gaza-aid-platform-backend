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
 *           example: { siteNameEn: Qaza Foundation, contactEmail: contact@example.com, totalBeneficiaries: 5000, yearsOfGiving: 12 }
 *     responses:
 *       200: { description: Settings updated successfully }
 *       400: { description: Invalid settings data or empty update body }
 *       401: { description: Admin authentication required }
 *       404: { description: Platform settings were not found }
 * /api/settings/logo:
 *   post:
 *     tags: [Settings]
 *     summary: Upload the site logo and persist it in platform settings
 *     description: Uploads to Cloudinary and stores the resulting secure URL in the existing PlatformSettings record.
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [logo]
 *             properties:
 *               logo: { type: string, format: binary }
 *     responses:
 *       200: { description: Site logo uploaded successfully }
 *       400: { description: Logo image file is required or unsupported format }
 *       401: { description: Admin authentication required }
 *       404: { description: Platform settings were not found }
 */
