import api from './api';

export const weatherService = {
  // Lấy dự báo thời tiết theo tỉnh thành hoặc tọa độ (PB07)
  getWeather: async (params = {}) => {
    return await api.get('/weather', { params });
  },
};

export default weatherService;
