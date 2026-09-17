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
 * /api/admin:
 *   post:
 *     tags: [Admin]
 *     summary: Create an administrator
 *     description: Requires SUPER_ADMIN role or the configured root-admin identity. The rootEmail and rootPassword fields confirm the root administrator before creation.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, rootEmail, rootPassword]
 *             additionalProperties: false
 *             properties:
 *               name: { type: string, minLength: 2, example: Operations Admin }
 *               email: { type: string, format: email, example: ops@example.com }
 *               password: { type: string, format: password, minLength: 8, example: StrongPass123 }
 *               role: { $ref: '#/components/schemas/AdminRole', default: ADMIN }
 *               rootEmail: { type: string, format: email, example: root@example.com }
 *               rootPassword: { type: string, format: password, example: RootPass123 }
 *     responses:
 *       201: { description: Admin created successfully }
 *       400: { description: Invalid or incomplete administrator data }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       409: { $ref: '#/components/responses/Conflict' }
 *   get:
 *     tags: [Admin]
 *     summary: List all administrators
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Admins fetched successfully }
 *       401: { description: Admin authentication required }
 * /api/admin/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Update an administrator
 *     description: Requires SUPER_ADMIN role or the configured root-admin identity. Administrators cannot modify themselves or the primary root admin.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string, pattern: '^[a-fA-F0-9]{24}$' }, example: 65f000000000000000000001 }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             additionalProperties: false
 *             properties:
 *               name: { type: string, minLength: 2, example: Updated Admin }
 *               role: { $ref: '#/components/schemas/AdminRole', example: ADMIN }
 *     responses:
 *       200: { description: Admin updated successfully }
 *       400: { description: Invalid ID or update data }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { description: Admin was not found }
 *   delete:
 *     tags: [Admin]
 *     summary: Soft-delete an administrator
 *     description: Requires SUPER_ADMIN role or the configured root-admin identity. Administrators cannot delete themselves or the primary root admin.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string }, example: 65f000000000000000000001 }
 *     responses:
 *       200: { description: Admin deleted successfully }
 *       400: { description: Invalid administrator ID }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { description: Admin was not found }
 */
