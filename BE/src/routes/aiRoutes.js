import express from 'express';
import {
  generateItinerary,
  regenerateDay,
  saveDraftToItinerary,
  getDraftById,
} from '../controllers/aiController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Yêu cầu đăng nhập tài khoản khách hàng cho toàn bộ nghiệp vụ AI
router.use(authenticate);

// 1. Sinh lịch trình tự động bằng Gemini AI (PB08, UI_17, UI_18)
router.post('/generate-itinerary', generateItinerary);

// 2. Tạo lại lịch trình cho 1 ngày cụ thể trong bản nháp
router.post('/regenerate-day', regenerateDay);

// 3. Lưu bản nháp AI thành lịch trình chính thức
router.post('/save-draft', saveDraftToItinerary);

// 4. Lấy chi tiết bản nháp AI
router.get('/draft/:id', getDraftById);

export default router;
