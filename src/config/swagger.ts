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
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
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
      { name: 'Wallets' },
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
