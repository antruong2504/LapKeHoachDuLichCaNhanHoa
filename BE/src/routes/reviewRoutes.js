import express from 'express';
import {
  createReview,
  getReviewsByDestination,
  deleteReview,
} from '../controllers/reviewController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public: Lấy danh sách đánh giá theo địa điểm
router.get('/destination/:dia_diem_id', getReviewsByDestination);

// Private (Khách hàng / Admin): Gửi đánh giá & Xóa đánh giá
router.post('/', authenticate, createReview);
router.delete('/:id', authenticate, deleteReview);

export default router;
