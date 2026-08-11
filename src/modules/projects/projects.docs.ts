/**
 * @openapi
 * /api/projects/stats:
 *   get:
 *     tags: [Projects]
 *     summary: Get project statistics
 *     responses:
 *       200: { description: Project statistics fetched successfully, content: { application/json: { example: { success: true, data: { total: 12, completed: 4 } } } } }
 *       404: { description: Project statistics were not found }
 * /api/projects:
 *   get:
 *     tags: [Projects]
 *     summary: List active projects
 *     responses:
 *       200: { description: Projects fetched successfully }
 *       404: { description: Projects were not found }
 *   post:
 *     tags: [Projects]
 *     summary: Create a project
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [titleAr, titleEn, descriptionAr, descriptionEn, targetAmount, status, categoryId]
 *             example: { titleAr: مشروع غذائي, titleEn: Food Project, descriptionAr: وصف المشروع باللغة العربية, descriptionEn: Project description in English, imageUrl: https://cdn.example.com/project.jpg, targetAmount: 10000, status: ACTIVE, categoryId: 65f000000000000000000002 }
 *     responses:
 *       201: { description: Project created successfully }
 *       400: { description: Validation failed }
 *       401: { description: Admin authentication required }
 *       404: { description: Category was not found }
 * /api/projects/{id}:
 *   get:
 *     tags: [Projects]
 *     summary: Get a project by ID
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string }, example: 65f000000000000000000003 }
 *     responses:
 *       200: { description: Project fetched successfully }
 *       400: { description: Invalid project ID }
 *       404: { description: Project was not found }
 *   put:
 *     tags: [Projects]
 *     summary: Update a project
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string }, example: 65f000000000000000000003 }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example: { titleEn: Updated Food Project, targetAmount: 15000, status: COMPLETED }
 *     responses:
 *       200: { description: Project updated successfully }
 *       400: { description: Invalid project data }
 *       401: { description: Admin authentication required }
 *       404: { description: Project was not found }
 *   delete:
 *     tags: [Projects]
 *     summary: Soft-delete a project
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string }, example: 65f000000000000000000003 }
 *     responses:
 *       200: { description: Project deleted successfully }
 *       400: { description: Invalid project ID }
 *       401: { description: Admin authentication required }
 *       404: { description: Project was not found }
 */
