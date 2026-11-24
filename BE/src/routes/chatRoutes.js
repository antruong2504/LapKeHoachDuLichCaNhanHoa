import express from 'express';
import {
  getMyChatGroups,
  createChatGroup,
  addGroupMember,
  getGroupMessages,
  sendMessageRest,
  searchChatUsers,
} from '../controllers/chatController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Tất cả API phòng chat yêu cầu đăng nhập
router.use(authenticate);

router.get('/users', searchChatUsers);
router.route('/groups').get(getMyChatGroups).post(createChatGroup);
router.post('/groups/:id/members', addGroupMember);
router.route('/groups/:id/messages').get(getGroupMessages).post(sendMessageRest);

export default router;
