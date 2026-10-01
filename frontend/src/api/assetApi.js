import { apiClient } from './client';

export const assetApi = {
  getAssets: async (params = {}) => {
    return apiClient.get('/assets', params);
  },

  getAssetById: async (id) => {
    return apiClient.get(`/assets/${id}`);
  },

  createAsset: async (assetData) => {
    return apiClient.post('/assets', assetData);
  },

  updateAsset: async (id, assetData) => {
    return apiClient.put(`/assets/${id}`, assetData);
  },

  deleteAsset: async (id) => {
    return apiClient.delete(`/assets/${id}`);
  },

  getAssetHistory: async (id, params = {}) => {
    return apiClient.get(`/assets/${id}/history`, params);
  },

  getAssetAssignments: async (id, params = {}) => {
    return apiClient.get(`/assets/${id}/assignments`, params);
  },

  getAssetTransfers: async (id, params = {}) => {
    return apiClient.get(`/assets/${id}/transfers`, params);
  },

  getAssetExpenses: async (id, params = {}) => {
    return apiClient.get(`/assets/${id}/expenses`, params);
  },
};
