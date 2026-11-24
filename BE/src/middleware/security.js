import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';

export const configureSecurityMiddleware = (app) => {
  // Helmet cấu hình header bảo mật
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
      contentSecurityPolicy: false,
    })
  );

  // CORS cho phép linh hoạt mọi origin trong môi trường dev
  app.use(
    cors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Nén response
  app.use(compression());
};
