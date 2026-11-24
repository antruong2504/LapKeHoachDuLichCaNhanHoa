import api from './api';

export const guideService = {
  // Lấy danh sách cẩm nang cộng đồng (PB11 - UI_23)
  getGuides: async (params = {}) => {
    return await api.get('/guides', { params });
  },

  // Lấy chi tiết 1 cẩm nang kèm bình luận & ảnh liên kết
  getGuideById: async (id) => {
    return await api.get(`/guides/${id}`);
  },

  // Upload ảnh cẩm nang (lưu vào cam_nang_hinh_anhs)
  uploadImage: async (formData) => {
    return await api.post('/guides/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Đăng cẩm nang mới
  createGuide: async (data) => {
    return await api.post('/guides', data);
  },

  // Bình luận cẩm nang
  addComment: async (guideId, noi_dung) => {
    return await api.post(`/guides/${guideId}/comments`, { noi_dung });
  },

  // Ghi nhận chia sẻ cẩm nang
  shareGuide: async (guideId) => {
    return await api.post(`/guides/${guideId}/share`);
  },

  // Xóa cẩm nang
  deleteGuide: async (guideId) => {
    return await api.delete(`/guides/${guideId}`);
  },

  // Admin: Lấy danh sách quản lý cẩm nang (PB14 - UI_34)
  getAdminGuides: async (params = {}) => {
    return await api.get('/admin/guides', { params });
  },

  // Admin: Xóa cẩm nang kèm lý do bắt buộc (PB14 - UI_36)
  adminDeleteGuide: async (guideId, ly_do) => {
    return await api.delete(`/admin/guides/${guideId}`, {
      data: { ly_do },
    });
  },
};

export default guideService;
