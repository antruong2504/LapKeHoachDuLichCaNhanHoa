import api from './api'

export const tripService = {
  // Lấy danh sách chuyến đi của user
  getMyTrips: async () => {
    const { data } = await api.get('/trips')
    return data
  },

  // Lấy chi tiết 1 chuyến đi
  getTripById: async (id) => {
    const { data } = await api.get(`/trips/${id}`)
    return data
  },

  // Tạo chuyến đi mới
  createTrip: async (tripData) => {
    const { data } = await api.post('/trips', tripData)
    return data
  },

  // Cập nhật chuyến đi
  updateTrip: async (id, tripData) => {
    const { data } = await api.put(`/trips/${id}`, tripData)
    return data
  },

  // Xóa chuyến đi
  deleteTrip: async (id) => {
    const { data } = await api.delete(`/trips/${id}`)
    return data
  },

  // Gợi ý kế hoạch AI
  generatePlan: async (preferences) => {
    const { data } = await api.post('/trips/generate', preferences)
    return data
  },
}
import api from './api'

export const tripService = {
  getMyTrips: async () => {
    const { data } = await api.get('/trips')
    return data
  },
  getTripById: async (id) => {
    const { data } = await api.get(`/trips/${id}`)
    return data
  },
  createTrip: async (tripData) => {
    const { data } = await api.post('/trips', tripData)
    return data
  },
  updateTrip: async (id, tripData) => {
    const { data } = await api.put(`/trips/${id}`, tripData)
    return data
  },
  deleteTrip: async (id) => {
    const { data } = await api.delete(`/trips/${id}`)
    return data
  },
  generatePlan: async (preferences) => {
    const { data } = await api.post('/trips/generate', preferences)
    return data
  },
}

