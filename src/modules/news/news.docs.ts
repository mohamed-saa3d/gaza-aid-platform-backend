/**
 * @openapi
 * /api/news:
 *   get:
 *     tags: [News]
 *     summary: List news articles
 *     responses:
 *       200: { description: News fetched successfully }
 *       404: { description: News articles were not found }
 *   post:
 *     tags: [News]
 *     summary: Create a news article
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example: { titleAr: خبر جديد, titleEn: New Announcement, descriptionAr: تفاصيل الخبر باللغة العربية, descriptionEn: Announcement details in English, imageUrl: https://cdn.example.com/news.jpg, detailsUrl: https://example.com/news/1, isUrgent: false }
 *     responses:
 *       201: { description: News created successfully }
 *       400: { description: Invalid news data }
 *       401: { description: Admin authentication required }
 * /api/news/{id}:
 *   get:
 *     tags: [News]
 *     summary: Get a news article
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string }, example: 65f000000000000000000006 }
 *     responses:
 *       200: { description: News article fetched successfully }
 *       404: { description: News article was not found }
 *   put:
 *     tags: [News]
 *     summary: Update a news article
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string }, example: 65f000000000000000000006 }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example: { titleEn: Updated Announcement, isUrgent: true }
 *     responses:
 *       200: { description: News updated successfully }
 *       400: { description: Invalid news data }
 *       401: { description: Admin authentication required }
 *       404: { description: News article was not found }
 *   delete:
 *     tags: [News]
 *     summary: Delete a news article
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string }, example: 65f000000000000000000006 }
 *     responses:
 *       200: { description: News deleted successfully }
 *       401: { description: Admin authentication required }
 *       404: { description: News article was not found }
 */
