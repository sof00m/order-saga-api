const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const ordersRoutes = require('./routes/orders');
const webhooksRoutes = require('./routes/webhooks');

const app = express();

app.use(express.json());

// Swagger - auto-generates docs from JSDoc comments in the route files
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: { title: 'Order Saga API', version: '1.0.0', description: 'Order lifecycle orchestration with Saga pattern' },
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
  },
  apis: ['./src/routes/*.js'],
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/auth', authRoutes);
app.use('/orders', ordersRoutes);
app.use('/webhooks', webhooksRoutes);

// 404
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Error handler - must be LAST
app.use(errorHandler);

module.exports = app;
