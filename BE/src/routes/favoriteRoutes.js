import express from 'express';
import {
  getMyFavorites,
  getMyFavoriteIds,
  addFavorite,
  removeFavorite,
  toggleFavorite,
} from '../controllers/favoriteController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Tất cả các route yêu thích đều yêu cầu người dùng đăng nhập
router.use(authenticate);

// 1. Lấy danh sách ID yêu thích để render icon tim nhanh
router.get('/my-ids', getMyFavoriteIds);

// 2. Lấy danh sách địa điểm yêu thích phân trang (PB04, UI_15)
router.get('/', getMyFavorites);

// 3. Toggle nhanh
router.post('/toggle/:dia_diem_id', toggleFavorite);

// 4. Thêm / Xóa yêu thích theo chuẩn RESTful
router.post('/:dia_diem_id', addFavorite);
router.delete('/:dia_diem_id', removeFavorite);

export default router;
