/**
 * @openapi
 * /api/admin/login:
 *   post:
 *     tags: [Admin]
 *     summary: Log in an administrator
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email, example: admin@example.com }
 *               password: { type: string, format: password, example: AdminPass123 }
 *     responses:
 *       200:
 *         description: Admin logged in successfully
 *         content:
 *           application/json:
 *             example: { success: true, message: Admin logged in successfully, data: { accessToken: eyJhbGciOi..., admin: { id: 65f000000000000000000001, email: admin@example.com, role: ADMIN } } }
 *       400: { description: Validation failed, content: { application/json: { example: { success: false, message: Invalid email address } } } }
 *       401: { description: Invalid credentials }
 */

/**
 * @openapi
 * /api/admin/profile:
 *   get:
 *     tags: [Admin]
 *     summary: Get the authenticated administrator profile
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200: { description: Admin profile fetched successfully }
 *       401: { description: Invalid or missing authentication token }
 *       404: { description: Admin was not found }
 * /api/admin:
 *   post:
 *     tags: [Admin]
 *     summary: Create an administrator
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example: { name: Operations Admin, email: ops@example.com, password: StrongPass123, role: ADMIN }
 *     responses:
 *       201: { description: Admin created successfully }
 *       400: { description: Invalid or incomplete administrator data }
 *       401: { description: Admin authentication required }
 *       404: { description: Related administrator was not found }
 *   get:
 *     tags: [Admin]
 *     summary: List all administrators
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200: { description: Admins fetched successfully }
 *       401: { description: Admin authentication required }
 * /api/admin/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Update an administrator
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string, pattern: '^[a-fA-F0-9]{24}$' }, example: 65f000000000000000000001 }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example: { name: Updated Admin, role: ADMIN }
 *     responses:
 *       200: { description: Admin updated successfully }
 *       400: { description: Invalid ID or update data }
 *       401: { description: Admin authentication required }
 *       404: { description: Admin was not found }
 *   delete:
 *     tags: [Admin]
 *     summary: Soft-delete an administrator
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string }, example: 65f000000000000000000001 }
 *     responses:
 *       200: { description: Admin deleted successfully }
 *       400: { description: Invalid administrator ID }
 *       401: { description: Admin authentication required }
 *       404: { description: Admin was not found }
 */
