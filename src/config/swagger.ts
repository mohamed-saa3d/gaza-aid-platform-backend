import swaggerJsdoc from 'swagger-jsdoc';

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Qaza Platform API',
      version: '1.0.0',
      description: 'API documentation for Qaza Platform backend',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token supplied in the Authorization header as Bearer <token>.',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'refreshToken',
          description: 'HTTP-only refresh token cookie used for refresh/logout operations.',
        },
      },
      schemas: {
        MinorAmountInteger: {
          type: 'integer',
          description:
            'Monetary values are represented in minor units (for example, piasters/cents) as integers. Example: 2500 means 25.00 in the selected currency.',
          example: 2500,
        },
        ApiSuccessResponse: {
          type: 'object',
          required: ['success'],
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Request completed successfully' },
            data: { nullable: true },
          },
        },
        ApiErrorResponse: {
          type: 'object',
          required: ['success', 'message'],
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Validation failed' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  code: { type: 'string', example: 'invalid_type' },
                  path: { type: 'array', items: { type: 'string' }, example: ['body', 'amount'] },
                  message: { type: 'string', example: 'Expected integer, received string' },
                },
              },
            },
          },
        },
        Donation: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '65f000000000000000000004' },
            amount: {
              $ref: '#/components/schemas/MinorAmountInteger',
              description: 'Donation amount in minor units.',
            },
            currency: { type: 'string', example: 'EGP' },
            projectId: { type: 'string', example: '65f000000000000000000003' },
            userId: { type: 'string', example: '65f000000000000000000001' },
          },
        },
        Project: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '65f000000000000000000003' },
            targetAmount: {
              $ref: '#/components/schemas/MinorAmountInteger',
              description: 'Project target amount in minor units.',
            },
            collectedAmount: {
              $ref: '#/components/schemas/MinorAmountInteger',
              description: 'Funds collected so far in minor units.',
            },
            currency: { type: 'string', example: 'EGP' },
            status: { type: 'string', example: 'ACTIVE' },
          },
        },
        Wallet: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '65f000000000000000000005' },
            userId: { type: 'string', example: '65f000000000000000000001' },
            balance: {
              $ref: '#/components/schemas/MinorAmountInteger',
              description: 'Current wallet balance in minor units.',
            },
            currency: { type: 'string', example: 'EGP' },
            status: { type: 'string', example: 'ACTIVE' },
          },
        },
        PaymentIntent: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '65f000000000000000000006' },
            amount: {
              $ref: '#/components/schemas/MinorAmountInteger',
              description: 'Payment amount in minor units.',
            },
            currency: { type: 'string', example: 'EGP' },
            purpose: { type: 'string', example: 'WALLET_FUNDING' },
            status: { type: 'string', example: 'PENDING' },
          },
        },
      },
      responses: {
        BadRequest: {
          description: 'Bad Request — validation failed or malformed payload.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiErrorResponse' },
              example: {
                success: false,
                message: 'Validation failed',
                errors: [
                  { code: 'invalid_type', path: ['body', 'amount'], message: 'Expected integer, received string' },
                ],
              },
            },
          },
        },
        Unauthorized: {
          description: 'Unauthorized — invalid, missing, expired, or unsigned request.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiErrorResponse' },
              example: { success: false, message: 'Authentication is required' },
            },
          },
        },
        Forbidden: {
          description: 'Forbidden — authenticated user lacks permission.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiErrorResponse' },
              example: { success: false, message: 'Forbidden' },
            },
          },
        },
        Conflict: {
          description: 'Conflict — the requested resource already exists or is in a conflicting state.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiErrorResponse' },
              example: { success: false, message: 'Email already exists' },
            },
          },
        },
      },
    },
    tags: [
      { name: 'Admin' },
      { name: 'Auth' },
      { name: 'Users' },
      { name: 'Projects' },
      { name: 'Donations' },
      { name: 'Payments' },
      { name: 'Wallet' },
      { name: 'News' },
      { name: 'FAQ' },
      { name: 'Live-Streams' },
      { name: 'Subscribers' },
      { name: 'Ratings' },
      { name: 'Settings' },
    ],
  },
  apis: ['./src/modules/**/*.docs.ts'],
});
