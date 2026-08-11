/**
 * @openapi
 * /api/ratings:
 *   post:
 *     tags: [Ratings]
 *     summary: Submit or update the authenticated user platform rating
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example: { value: 5, comment: Excellent donation experience }
 *     responses:
 *       200: { description: Rating submitted successfully }
 *       400: { description: Rating must be an integer from 1 to 5 or comment is too long }
 *       401: { description: Authentication is required }
 *       404: { description: User was not found }
 *   get:
 *     tags: [Ratings]
 *     summary: List platform ratings
 *     responses:
 *       200: { description: Platform ratings fetched successfully }
 *       404: { description: Ratings were not found }
 * /api/ratings/stats:
 *   get:
 *     tags: [Ratings]
 *     summary: Get platform rating statistics
 *     responses:
 *       200: { description: Platform rating statistics fetched successfully, content: { application/json: { example: { success: true, data: { average: 4.7, total: 340 } } } } }
 *       404: { description: Rating statistics were not found }
 */
