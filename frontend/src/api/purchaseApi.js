import { apiClient } from './client';

export const purchaseApi = {
  getPurchases: async (params = {}) => {
    return apiClient.get('/purchases', params);
  },

  getPurchaseById: async (id) => {
    return apiClient.get(`/purchases/${id}`);
  },

  createPurchase: async (purchaseData) => {
    return apiClient.post('/purchases', purchaseData);
  },

  updatePurchase: async (id, purchaseData) => {
    return apiClient.put(`/purchases/${id}`, purchaseData);
  },

  deletePurchase: async (id) => {
    return apiClient.delete(`/purchases/${id}`);
  },
};
