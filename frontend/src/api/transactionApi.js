import { apiClient } from './client';

export const transactionApi = {
  getTransactions: async (params = {}) => {
    return apiClient.get('/transactions', params);
  },

  getTransactionById: async (id) => {
    return apiClient.get(`/transactions/${id}`);
  },
};
