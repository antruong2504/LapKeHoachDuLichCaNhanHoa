import api from './api';

export const destinationService = {
  // Lấy danh sách tỉnh / thành
  getProvinces: async () => {
    return await api.get('/destinations/provinces');
  },

  // Lấy danh sách địa điểm (có phân trang & bộ lọc)
  getDestinations: async (params = {}) => {
    return await api.get('/destinations', { params });
  },

  // Lấy chi tiết 1 địa điểm
  getDestinationById: async (id) => {
    return await api.get(`/destinations/${id}`);
  },

  // Tạo địa điểm mới (Admin)
  createDestination: async (data) => {
    return await api.post('/destinations', data);
  },

  // Cập nhật địa điểm (Admin - có phien_ban)
  updateDestination: async (id, data) => {
    return await api.put(`/destinations/${id}`, data);
  },

  // Bật/tắt cờ nổi bật
  toggleFeatured: async (id) => {
    return await api.patch(`/destinations/${id}/toggle-featured`);
  },

  // Xóa mềm địa điểm
  deleteDestination: async (id) => {
    return await api.delete(`/destinations/${id}`);
  },

  // Khôi phục địa điểm đã xóa mềm
  restoreDestination: async (id) => {
    return await api.patch(`/destinations/${id}/restore`);
  },

  // Tải lên hình ảnh địa điểm
  uploadImage: async (formData) => {
    return await api.post('/destinations/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default destinationService;
