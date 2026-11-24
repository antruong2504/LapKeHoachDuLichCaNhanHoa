import api from './api';

export const notificationService = {
  // Lấy danh sách thông báo cá nhân & unread_count (PB13 - UI_25)
  getMyNotifications: async () => {
    return await api.get('/notifications');
  },

  // Đánh dấu 1 thông báo đã đọc
  markAsRead: async (id) => {
    return await api.patch(`/notifications/${id}/read`);
  },

  // Đánh dấu đã đọc tất cả thông báo
  markAllAsRead: async () => {
    return await api.patch('/notifications/read-all');
  },

  // Gửi thông báo kiểm thử realtime
  sendTestNotification: async (data = {}) => {
    return await api.post('/notifications/test', data);
  },
};

export default notificationService;
