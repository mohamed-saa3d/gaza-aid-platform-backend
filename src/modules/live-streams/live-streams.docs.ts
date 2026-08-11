/**
 * @openapi
 * /api/live-streams:
 *   get:
 *     tags: [Live-Streams]
 *     summary: List live streams
 *     responses:
 *       200: { description: Live streams fetched successfully }
 *       404: { description: Live streams were not found }
 *   post:
 *     tags: [Live-Streams]
 *     summary: Create a live stream
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example: { titleAr: بث مباشر, titleEn: Live Stream, youtubeUrl: https://www.youtube.com/watch?v=example, isActive: true }
 *     responses:
 *       201: { description: Live stream created successfully }
 *       400: { description: Invalid live stream data }
 *       401: { description: Admin authentication required }
 * /api/live-streams/{id}:
 *   get:
 *     tags: [Live-Streams]
 *     summary: Get a live stream by ID
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string }, example: 65f000000000000000000008 }
 *     responses:
 *       200: { description: Live stream fetched successfully }
 *       404: { description: Live stream was not found }
 *   put:
 *     tags: [Live-Streams]
 *     summary: Update a live stream
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string }, example: 65f000000000000000000008 }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example: { titleEn: Updated Live Stream, isActive: false }
 *     responses:
 *       200: { description: Live stream updated successfully }
 *       400: { description: Invalid live stream data }
 *       401: { description: Admin authentication required }
 *       404: { description: Live stream was not found }
 *   delete:
 *     tags: [Live-Streams]
 *     summary: Delete a live stream
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string }, example: 65f000000000000000000008 }
 *     responses:
 *       200: { description: Live stream deleted successfully }
 *       401: { description: Admin authentication required }
 *       404: { description: Live stream was not found }
 */
