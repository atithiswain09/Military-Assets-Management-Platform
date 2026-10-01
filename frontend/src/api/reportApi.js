import { apiClient } from './client';

export const reportApi = {
  getDashboardStats: async () => {
    return apiClient.get('/reports/dashboard');
  },

  getAssetReport: async () => {
    return apiClient.get('/reports/assets');
  },

  getPurchaseReport: async () => {
    return apiClient.get('/reports/purchases');
  },

  getTransferReport: async () => {
    return apiClient.get('/reports/transfers');
  },

  getAssignmentReport: async () => {
    return apiClient.get('/reports/assignments');
  },

  getExpenseReport: async () => {
    return apiClient.get('/reports/expenses');
  },

  getMovementReport: async () => {
    return apiClient.get('/reports/movement');
  },
};
