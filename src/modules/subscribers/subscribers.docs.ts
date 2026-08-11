/**
 * @openapi
 * /api/subscribers:
 *   post:
 *     tags: [Subscribers]
 *     summary: Subscribe an email address
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example: { email: supporter@example.com }
 *     responses:
 *       201: { description: Subscriber created successfully }
 *       400: { description: Invalid email address }
 *       404: { description: Subscriber service was not found }
 *   get:
 *     tags: [Subscribers]
 *     summary: List subscribers for administrators
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200: { description: Subscribers fetched successfully }
 *       401: { description: Admin authentication required }
 *       404: { description: Subscribers were not found }
 * /api/subscribers/count:
 *   get:
 *     tags: [Subscribers]
 *     summary: Get the subscriber count
 *     responses:
 *       200: { description: Subscriber count fetched successfully, content: { application/json: { example: { success: true, data: { count: 1250 } } } } }
 *       404: { description: Subscriber count was not found }
 * /api/subscribers/broadcast:
 *   post:
 *     tags: [Subscribers]
 *     summary: Broadcast a message to subscribers
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example: { subject: Monthly Update, message: Thank you for supporting our projects. }
 *     responses:
 *       200: { description: Broadcast sent successfully }
 *       400: { description: Subject or message is required }
 *       401: { description: Admin authentication required }
 *       404: { description: Subscriber service was not found }
 */
