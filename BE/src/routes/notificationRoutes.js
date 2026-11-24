import express from 'express';
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  createTestNotification,
} from '../controllers/notificationController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getMyNotifications);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);
router.post('/test', createTestNotification);

export default router;
