import api from './api';

export const favoriteService = {
  // Lấy danh sách địa điểm yêu thích (PB04, UI_15)
  getMyFavorites: async (params = {}) => {
    return await api.get('/favorites', { params });
  },

  // Lấy danh sách ID các địa điểm đã yêu thích
  getMyFavoriteIds: async () => {
    return await api.get('/favorites/my-ids');
  },

  // Chuyển đổi trạng thái yêu thích (Toggle)
  toggleFavorite: async (destinationId) => {
    return await api.post(`/favorites/toggle/${destinationId}`);
  },

  // Thêm vào yêu thích
  addFavorite: async (destinationId) => {
    return await api.post(`/favorites/${destinationId}`);
  },

  // Xóa khỏi yêu thích
  removeFavorite: async (destinationId) => {
    return await api.delete(`/favorites/${destinationId}`);
  },
};

export default favoriteService;
