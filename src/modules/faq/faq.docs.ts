/**
 * @openapi
 * /api/faq:
 *   get:
 *     tags: [FAQ]
 *     summary: List frequently asked questions
 *     responses:
 *       200: { description: FAQs fetched successfully }
 *       404: { description: FAQs were not found }
 *   post:
 *     tags: [FAQ]
 *     summary: Create an FAQ
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example: { questionAr: ما هي المنصة؟, questionEn: What is the platform?, answerAr: منصة للتبرع, answerEn: A donation platform, isActive: true }
 *     responses:
 *       201: { description: FAQ created successfully }
 *       400: { description: Invalid FAQ data }
 *       401: { description: Admin authentication required }
 * /api/faq/{id}:
 *   get:
 *     tags: [FAQ]
 *     summary: Get an FAQ by ID
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string }, example: 65f000000000000000000007 }
 *     responses:
 *       200: { description: FAQ fetched successfully }
 *       404: { description: FAQ was not found }
 *   put:
 *     tags: [FAQ]
 *     summary: Update an FAQ
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string }, example: 65f000000000000000000007 }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example: { answerEn: Updated answer, isActive: true }
 *     responses:
 *       200: { description: FAQ updated successfully }
 *       400: { description: Invalid FAQ data }
 *       401: { description: Admin authentication required }
 *       404: { description: FAQ was not found }
 *   delete:
 *     tags: [FAQ]
 *     summary: Delete an FAQ
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string }, example: 65f000000000000000000007 }
 *     responses:
 *       200: { description: FAQ deleted successfully }
 *       401: { description: Admin authentication required }
 *       404: { description: FAQ was not found }
 */
