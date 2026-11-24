import express from 'express';
import multer from 'multer';
import {
  getGuides,
  getGuideById,
  uploadGuideImage,
  createGuide,
  addGuideComment,
  shareGuide,
  deleteGuide,
} from '../controllers/guideController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { cacheResponse, invalidateOnMutation } from '../utils/memoryCache.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file hình ảnh định dạng JPG, PNG, WEBP'));
    }
  },
});

const clearGuideCache = invalidateOnMutation(['guides:']);

// Public: Xem danh sách & chi tiết cẩm nang (cache 2 phút)
router.get('/', cacheResponse('guides:', 120_000), getGuides);
router.get('/:id', cacheResponse('guides:', 120_000), getGuideById);

// Private (Khách hàng / Admin): Upload ảnh, đăng cẩm nang, bình luận, chia sẻ, xóa
router.post('/upload', authenticate, upload.single('image'), uploadGuideImage);
router.post('/', authenticate, clearGuideCache, createGuide);
router.post('/:id/comments', authenticate, clearGuideCache, addGuideComment);
router.post('/:id/share', authenticate, clearGuideCache, shareGuide);
router.delete('/:id', authenticate, clearGuideCache, deleteGuide);

export default router;
