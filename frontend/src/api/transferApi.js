import { apiClient } from './client';

export const transferApi = {
  getTransfers: async (params = {}) => {
    return apiClient.get('/transfers', params);
  },

  getTransferById: async (id) => {
    return apiClient.get(`/transfers/${id}`);
  },

  createTransfer: async (transferData) => {
    return apiClient.post('/transfers', transferData);
  },

  approveTransfer: async (id) => {
    return apiClient.patch(`/transfers/${id}/approve`);
  },

  completeTransfer: async (id) => {
    return apiClient.patch(`/transfers/${id}/complete`);
  },

  cancelTransfer: async (id) => {
    return apiClient.patch(`/transfers/${id}/cancel`);
  },
};
