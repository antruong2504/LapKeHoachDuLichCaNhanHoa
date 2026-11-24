import api from './api';

export const adminService = {
  // PB16: Quản lý tài khoản người dùng (UI_31 - UI_33)
  getUsers: async (params = {}) => {
    return await api.get('/admin/users', { params });
  },
  toggleUserStatus: async (userId, data) => {
    return await api.patch(`/admin/users/${userId}/status`, data);
  },

  // PB17: Quản lý đánh giá (UI_37 - UI_39)
  getReviews: async (params = {}) => {
    return await api.get('/admin/reviews', { params });
  },
  deleteReview: async (reviewId, ly_do) => {
    return await api.delete(`/admin/reviews/${reviewId}`, {
      data: { ly_do },
    });
  },

  // PB18: Thống kê & Báo cáo Dashboard (UI_26)
  getDashboardStats: async (params = {}) => {
    return await api.get('/admin/stats', { params });
  },
};

export default adminService;
