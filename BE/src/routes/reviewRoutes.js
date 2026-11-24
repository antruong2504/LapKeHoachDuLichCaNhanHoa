import express from 'express';
import {
  createReview,
  getReviewsByDestination,
  deleteReview,
} from '../controllers/reviewController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { invalidateOnMutation } from '../utils/memoryCache.js';

const router = express.Router();
const clearDestReviewCache = invalidateOnMutation(['destinations:']);

// Public: Lấy danh sách đánh giá theo địa điểm
router.get('/destination/:dia_diem_id', getReviewsByDestination);

// Private (Khách hàng / Admin): Gửi đánh giá & Xóa đánh giá
router.post('/', authenticate, clearDestReviewCache, createReview);
router.delete('/:id', authenticate, clearDestReviewCache, deleteReview);

export default router;
