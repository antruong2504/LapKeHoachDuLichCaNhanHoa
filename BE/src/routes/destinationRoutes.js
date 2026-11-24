import express from 'express';
import multer from 'multer';
import {
  getProvinces,
  getDestinations,
  getDestinationById,
  createDestination,
  updateDestination,
  toggleFeatured,
  deleteDestination,
  restoreDestination,
  uploadDestinationImage,
} from '../controllers/destinationController.js';
import { authenticate, requireAdmin } from '../middleware/authMiddleware.js';
import { cacheResponse, invalidateOnMutation } from '../utils/memoryCache.js';

const router = express.Router();

// Cấu hình Multer bộ nhớ tạm để upload ảnh địa điểm
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Tối đa 10MB cho ảnh địa điểm chất lượng cao
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file hình ảnh định dạng JPG, PNG, WEBP'));
    }
  },
});

// 1. Danh sách tỉnh thành phố (Public - cache 10 phút)
router.get('/provinces', cacheResponse('provinces:', 600_000), getProvinces);

// 2. Danh sách địa điểm du lịch & Chi tiết (Public hoặc Admin - cache 2 phút)
router.get('/', cacheResponse('destinations:', 120_000), getDestinations);
router.get('/:id', cacheResponse('destinations:', 120_000), getDestinationById);

// 3. Nghiệp vụ Quản trị viên (PB19 - Yêu cầu Token & Vai trò admin)
const clearDestCache = invalidateOnMutation(['destinations:', 'provinces:']);
router.post('/', authenticate, requireAdmin, clearDestCache, createDestination);
router.put('/:id', authenticate, requireAdmin, clearDestCache, updateDestination);
router.patch('/:id/toggle-featured', authenticate, requireAdmin, clearDestCache, toggleFeatured);
router.delete('/:id', authenticate, requireAdmin, clearDestCache, deleteDestination); // Xóa mềm
router.patch('/:id/restore', authenticate, requireAdmin, clearDestCache, restoreDestination); // Khôi phục xóa mềm
router.post('/upload', authenticate, requireAdmin, upload.single('image'), uploadDestinationImage);

export default router;
