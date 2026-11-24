import api from './api';

export const mapService = {
  // Tối ưu hóa thứ tự lộ trình ngắn nhất (TSP - tối đa 10 điểm)
  optimizeRoute: async (data) => {
    return await api.post('/maps/optimize-route', data);
  },

  // Tính toán khoảng cách & polyline theo thứ tự người dùng chỉ định
  calculateRoute: async (data) => {
    return await api.post('/maps/calculate-route', data);
  },
};

export default mapService;
