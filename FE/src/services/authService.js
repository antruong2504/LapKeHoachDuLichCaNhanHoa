import api from './api'

export const authService = {
  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    return data
  },
  register: async (userData) => {
    const { data } = await api.post('/auth/register', userData)
    return data
  },
  getProfile: async () => {
    const { data } = await api.get('/auth/me')
    return data
  },
  updateProfile: async (userData) => {
    const { data } = await api.put('/auth/me', userData)
    return data
  },
}
import api from './api'

export const authService = {
  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    return data
  },
  register: async (userData) => {
    const { data } = await api.post('/auth/register', userData)
    return data
  },
  getProfile: async () => {
    const { data } = await api.get('/auth/me')
    return data
  },
  updateProfile: async (userData) => {
    const { data } = await api.put('/auth/me', userData)
    return data
  },
}

