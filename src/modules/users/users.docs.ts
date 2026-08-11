/**
 * @openapi
 * /api/users/profile:
 *   get:
 *     tags: [Users]
 *     summary: Get the authenticated user profile
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: User profile fetched successfully
 *         content:
 *           application/json:
 *             example: { success: true, message: User profile fetched successfully, data: { id: 65f000000000000000000001, name: Ahmed Ali, email: donor@example.com, avatar: null, role: DONOR } }
 *       401: { description: Authentication is required }
 *       404: { description: User was not found }
 *   patch:
 *     tags: [Users]
 *     summary: Update the authenticated user profile
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example: { name: Ahmed Hassan, avatar: https://cdn.example.com/avatar.jpg }
 *     responses:
 *       200: { description: User profile updated successfully }
 *       400: { description: Invalid profile data }
 *       401: { description: Authentication is required }
 *       404: { description: User was not found }
 * /api/users/change-password:
 *   post:
 *     tags: [Users]
 *     summary: Change the authenticated user password
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example: { oldPassword: OldPass123, newPassword: NewPass123 }
 *     responses:
 *       200: { description: Password changed successfully }
 *       400: { description: Password validation failed }
 *       401: { description: Authentication failed or old password is incorrect }
 *       404: { description: User was not found }
 * /api/users/account:
 *   delete:
 *     tags: [Users]
 *     summary: Soft-delete the authenticated account
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200: { description: User account soft deleted successfully }
 *       401: { description: Authentication is required }
 *       404: { description: User was not found }
 * /api/users/admin/all:
 *   get:
 *     tags: [Users]
 *     summary: List active users for administrators
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - { name: page, in: query, schema: { type: integer, minimum: 1, default: 1 }, example: 1 }
 *       - { name: limit, in: query, schema: { type: integer, minimum: 1, default: 10 }, example: 10 }
 *     responses:
 *       200: { description: Active users fetched successfully }
 *       401: { description: Admin authentication required }
 *       404: { description: Users were not found }
 * /api/users/me/donations:
 *   get:
 *     tags: [Users]
 *     summary: Get donations belonging to the authenticated user
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200: { description: User donations fetched successfully }
 *       401: { description: Authentication is required }
 *       404: { description: User was not found }
 */
