import { apiClient } from './client';

export const expenseApi = {
  getExpenses: async (params = {}) => {
    return apiClient.get('/expenses', params);
  },

  getExpenseById: async (id) => {
    return apiClient.get(`/expenses/${id}`);
  },

  createExpense: async (expenseData) => {
    return apiClient.post('/expenses', expenseData);
  },

  updateExpense: async (id, expenseData) => {
    return apiClient.put(`/expenses/${id}`, expenseData);
  },

  deleteExpense: async (id) => {
    return apiClient.delete(`/expenses/${id}`);
  },
};
