import express from 'express';
import { getAdminGuides, adminDeleteGuide } from '../controllers/guideController.js';
import { getAdminUsers, toggleUserStatus } from '../controllers/adminUserController.js';
import { getAdminReviews, adminDeleteReview } from '../controllers/reviewController.js';
import { getDashboardStats } from '../controllers/adminStatsController.js';
import { authenticate, requireAdmin } from '../middleware/authMiddleware.js';
import { invalidateOnMutation } from '../utils/memoryCache.js';

const router = express.Router();

// Tất cả API quản trị yêu cầu đăng nhập và vai trò admin
router.use(authenticate, requireAdmin);

// PB14: Admin Quản lý cẩm nang du lịch (UI_34 - UI_36)
router.get('/guides', getAdminGuides);
router.delete('/guides/:id', invalidateOnMutation(['guides:']), adminDeleteGuide);

// PB16: Admin Quản lý tài khoản người dùng (UI_31 - UI_33)
router.get('/users', getAdminUsers);
router.patch('/users/:id/status', toggleUserStatus);

// PB17: Admin Quản lý đánh giá (UI_37 - UI_39)
router.get('/reviews', getAdminReviews);
router.delete('/reviews/:id', invalidateOnMutation(['destinations:']), adminDeleteReview);

// PB18: Admin Tổng quan, Thống kê & Báo cáo (UI_26)
router.get('/stats', getDashboardStats);

export default router;
