import { apiClient } from './client';

export const userApi = {
  getUsers: async (params = {}) => {
    return apiClient.get('/users', params);
  },

  getUserById: async (id) => {
    return apiClient.get(`/users/${id}`);
  },

  createUser: async (userData) => {
    return apiClient.post('/users', userData);
  },

  updateUser: async (id, userData) => {
    return apiClient.put(`/users/${id}`, userData);
  },

  updateUserStatus: async (id, status) => {
    return apiClient.patch(`/users/${id}/status`, { status });
  },

  deleteUser: async (id) => {
    return apiClient.delete(`/users/${id}`);
  },
};
