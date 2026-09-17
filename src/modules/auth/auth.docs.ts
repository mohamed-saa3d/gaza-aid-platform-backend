/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new donor account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Ahmed Ali
 *               email:
 *                 type: string
 *                 format: email
 *                 example: donor@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: StrongPass123
 *               image:
 *                 type: string
 *                 format: uri
 *                 example: https://cdn.example.com/avatar.jpg
 *     responses:
 *       201:
 *         description: Registration initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccessResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in a donor account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: donor@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: StrongPass123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: User logged in successfully }
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken: { type: string, example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... }
 *                     user: { type: object, additionalProperties: true }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         description: Too many login attempts
 */

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh the access token using the refreshToken cookie
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Access token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [success, data]
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Access token refreshed successfully
 *                 data:
 *                   type: object
 *                   required: [accessToken]
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Log out the authenticated user and revoke the refresh token
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       204:
 *         description: Logged out successfully. The refreshToken cookie is cleared.
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @openapi
 * /api/auth/verify-email:
 *   post:
 *     tags: [Auth]
 *     summary: Verify a donor email address with a six-digit OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: donor@example.com
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */

/**
 * @openapi
 * /api/auth/resend-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Resend an email verification OTP
 *     description: Returns a generic success response whether or not the email belongs to an unverified account to prevent email enumeration.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: donor@example.com
 *     responses:
 *       200:
 *         description: Generic OTP delivery response. The endpoint does not reveal whether the account exists or is already verified.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccessResponse'
 *             example:
 *               success: true
 *               message: If the account exists and needs verification, a new OTP was sent
 *               data: { redirectTo: /verify-otp }
 *         headers:
 *           RateLimit-Limit:
 *             description: Maximum requests allowed in the current rate-limit window.
 *             schema: { type: integer }
 *           RateLimit-Remaining:
 *             description: Requests remaining in the current rate-limit window.
 *             schema: { type: integer }
 *           RateLimit-Reset:
 *             description: Unix timestamp when the current rate-limit window resets.
 *             schema: { type: integer }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         description: Too many OTP requests. The endpoint uses the authentication rate limiter, five requests per 15 minutes.
 */

/**
 * @openapi
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: donor@example.com
 *     responses:
 *       200:
 *         description: Password reset flow started
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */

/**
 * @openapi
 * /api/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset a donor password using an OTP
 *     description: On successful reset, all active refresh-token sessions for the user are revoked.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [otp, newPassword]
 *             properties:
 *               otp:
 *                 type: string
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: NewStrongPass123
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */

/**
 * @openapi
 * /api/auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Change the authenticated donor password
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [oldPassword, newPassword]
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 format: password
 *                 example: OldStrongPass123
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: NewStrongPass123
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
