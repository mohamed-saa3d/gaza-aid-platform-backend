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
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Admin profile fetched successfully }
 *       401: { description: Invalid or missing authentication token }
 *       404: { description: Admin was not found }
 */
