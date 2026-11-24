import api from './api';

export const tripService = {
  // Lấy danh sách lịch trình cá nhân (PB09 - UI_20)
  getMyTrips: async () => {
    return await api.get('/trips');
  },

  // Lấy chi tiết lịch trình (PB09 - UI_21)
  getTripById: async (id) => {
    return await api.get(`/trips/${id}`);
  },

  // Tạo lịch trình thủ công (PB20 - UI_19)
  createManualTrip: async (tripData) => {
    return await api.post('/trips/manual', tripData);
  },

  // Cập nhật lịch trình - Optimistic Locking (PB09 - UI_21)
  updateTrip: async (id, tripData) => {
    return await api.put(`/trips/${id}`, tripData);
  },

  // Xóa lịch trình (PB09 - UI_22)
  deleteTrip: async (id) => {
    return await api.delete(`/trips/${id}`);
  },
};

export default tripService;
