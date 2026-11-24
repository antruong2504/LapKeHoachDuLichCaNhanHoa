import express from 'express';
import multer from 'multer';
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  changePassword,
} from '../controllers/userController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Cấu hình Multer lưu bộ nhớ tạm (Buffer) để upload lên Supabase hoặc ghi đĩa
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Tối đa 5MB theo chuẩn PB03
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file định dạng hình ảnh (JPG, JPEG, PNG, WEBP)'));
    }
  },
});

// Tất cả routes hồ sơ cá nhân đều yêu cầu xác thực JWT (PB03)
router.use(authenticate);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/avatar', upload.single('avatar'), uploadAvatar);
router.put('/change-password', changePassword);

export default router;
