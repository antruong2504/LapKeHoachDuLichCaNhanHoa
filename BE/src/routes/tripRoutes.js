import express from 'express';
import {
  getTrips,
  getTripById,
  createManualTrip,
  updateTrip,
  deleteTrip,
} from '../controllers/tripController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Tất cả các thao tác lịch trình yêu cầu đăng nhập
router.use(authenticate);

// PB20: Tạo lịch trình thủ công (UI_19)
router.post('/manual', createManualTrip);

// PB09: Lấy danh sách lịch trình của tôi (UI_20) & Tạo lịch trình
router.route('/')
  .get(getTrips)
  .post(createManualTrip);

// PB09: Xem chi tiết (UI_21), Cập nhật (Optimistic Locking) và Xóa (UI_22)
router.route('/:id')
  .get(getTripById)
  .put(updateTrip)
  .delete(deleteTrip);

export default router;
