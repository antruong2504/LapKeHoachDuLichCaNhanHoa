import api from './api';

export const categoryService = {
  getTree: async () => {
    return await api.get('/categories/tree');
  },
  createGroup: async (data) => {
    return await api.post('/categories/groups', data);
  },
  updateGroup: async (id, data) => {
    return await api.put(`/categories/groups/${id}`, data);
  },
  deleteGroup: async (id) => {
    return await api.delete(`/categories/groups/${id}`);
  },
  createCategory: async (data) => {
    return await api.post('/categories/items', data);
  },
  updateCategory: async (id, data) => {
    return await api.put(`/categories/items/${id}`, data);
  },
  deleteCategory: async (id) => {
    return await api.delete(`/categories/items/${id}`);
  },
};

export default categoryService;
