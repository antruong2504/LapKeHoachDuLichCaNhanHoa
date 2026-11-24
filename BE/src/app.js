import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import prisma from './config/db.js';
import { configureSecurityMiddleware } from './middleware/security.js';
import { setupSocketHandlers } from './sockets/socketHandler.js';
import { setupSwagger } from './docs/swagger.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';

// Polyfill BigInt toJSON cho Prisma
BigInt.prototype.toJSON = function () {
  return this.toString();
};

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Cấu hình Socket.IO
const io = new Server(server, {
  cors: {
    origin: [
      process.env.CLIENT_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ],
    credentials: true,
  },
});
setupSocketHandlers(io);

// Lưu io vào app để controller có thể gọi emit khi cần
app.set('io', io);

// Bảo mật và nén response
configureSecurityMiddleware(app);

// Parser dữ liệu
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Static folder upload ảnh
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Swagger Documentation
setupSwagger(app);

// API Health Check & Database Status
app.get('/api/health', async (req, res) => {
  try {
    const provinceCount = await prisma.tinh_thanh_phos.count();
    const destinationCount = await prisma.dia_diems.count();
    const userCount = await prisma.tai_khoans.count();

    res.json({
      success: true,
      message: 'TripMate Backend & Supabase Database đang hoạt động ổn định',
      data: {
        server_time: new Date().toISOString(),
        timezone: 'Asia/Ho_Chi_Minh (UTC+7)',
        database: 'Supabase PostgreSQL Cloud',
        counts: {
          tinh_thanh_phos: provinceCount,
          dia_diems: destinationCount,
          tai_khoans: userCount,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi kết nối cơ sở dữ liệu Supabase',
      error: error.message,
    });
  }
});

// Import placeholder / initial routes
import authRoutes from './routes/authRoutes.js';
import tripRoutes from './routes/tripRoutes.js';
import userRoutes from './routes/userRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import destinationRoutes from './routes/destinationRoutes.js';
import favoriteRoutes from './routes/favoriteRoutes.js';
import mapRoutes from './routes/mapRoutes.js';
import weatherRoutes from './routes/weatherRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import guideRoutes from './routes/guideRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin/categories', categoryRoutes);
app.use('/api/destinations', destinationRoutes);
app.use('/api/admin/destinations', destinationRoutes);
app.use('/api/provinces', destinationRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/maps', mapRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/guides', guideRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// Error handlers
app.use(notFound);
app.use(errorHandler);

// Khởi chạy HTTP + Socket Server độc quyền trên cổng PORT (5001)
server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 TRIPMATE SERVER ĐANG CHẠY TẠI: http://localhost:${PORT}`);
  console.log(`📚 TÀI LIỆU API (SWAGGER):      http://localhost:${PORT}/api/docs`);
  console.log(`💓 HEALTHCHECK ENDPOINT:        http://localhost:${PORT}/api/health`);
  console.log(`⚡ REALTIME SOCKET.IO SẴN SÀNG`);
  console.log(`=======================================================`);
});

export { app, server, io };
