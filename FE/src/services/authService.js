import api from './api';

export const authService = {
  login: async (ten_dang_nhap, mat_khau) => {
    return await api.post('/auth/login', { ten_dang_nhap, mat_khau });
  },
  register: async (userData) => {
    return await api.post('/auth/register', userData);
  },
  getProfile: async () => {
    return await api.get('/users/profile');
  },
  updateProfile: async (userData) => {
    return await api.put('/users/profile', userData);
  },
  uploadAvatar: async (formData) => {
    return await api.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  changePassword: async (passwordData) => {
    return await api.put('/users/change-password', passwordData);
  },
};
