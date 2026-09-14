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
 *       200:
 *         description: Projects fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Project'
 *       404: { description: Projects were not found }
 *   post:
 *     tags: [Projects]
 *     summary: Create a project
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [titleAr, titleEn, descriptionAr, descriptionEn, targetAmount, status, categoryId]
 *             properties:
 *               titleAr: { type: string, example: مشروع غذائي }
 *               titleEn: { type: string, example: Food Project }
 *               descriptionAr: { type: string, example: وصف المشروع باللغة العربية }
 *               descriptionEn: { type: string, example: Project description in English }
 *               imageUrl: { type: string, format: uri, example: https://cdn.example.com/project.jpg }
 *               targetAmount:
 *                 $ref: '#/components/schemas/MinorAmountInteger'
 *                 description: Project funding target in minor units (cents/piasters). Example 10000 = 100.00.
 *               status: { type: string, example: ACTIVE }
 *               categoryId: { type: string, example: 65f000000000000000000002 }
 *     responses:
 *       201: { description: Project created successfully }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { description: Category was not found }
 * /api/projects/{id}:
 *   get:
 *     tags: [Projects]
 *     summary: Get a project by ID
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string }, example: 65f000000000000000000003 }
 *     responses:
 *       200:
 *         description: Project fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       404: { description: Project was not found }
 *   put:
 *     tags: [Projects]
 *     summary: Update a project
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string }, example: 65f000000000000000000003 }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titleEn: { type: string, example: Updated Food Project }
 *               targetAmount:
 *                 $ref: '#/components/schemas/MinorAmountInteger'
 *                 description: Updated project funding target in minor units.
 *               status: { type: string, example: COMPLETED }
 *     responses:
 *       200: { description: Project updated successfully }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { description: Project was not found }
 *   delete:
 *     tags: [Projects]
 *     summary: Soft-delete a project
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string }, example: 65f000000000000000000003 }
 *     responses:
 *       200: { description: Project deleted successfully }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { description: Project was not found }
 */
