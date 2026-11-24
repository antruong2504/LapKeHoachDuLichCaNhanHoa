import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TripMate API Documentation',
      version: '1.0.0',
      description: 'Đặc tả 20 mục chức năng (PB01 - PB20) cho nền tảng lập kế hoạch du lịch cá nhân hóa ứng dụng AI (TripMate)',
      contact: {
        name: 'TripMate Development Team',
        email: 'support@tripmate.vn',
      },
    },
    servers: [
      {
        url: 'http://localhost:5001/api',
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

export const setupSwagger = (app) => {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
  console.log('[Swagger UI] Tài liệu API khả dụng tại: http://localhost:5000/api/docs');
};
