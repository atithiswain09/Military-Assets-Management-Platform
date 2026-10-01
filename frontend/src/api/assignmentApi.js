import { apiClient } from './client';

export const assignmentApi = {
  getAssignments: async (params = {}) => {
    return apiClient.get('/assignments', params);
  },

  getAssignmentById: async (id) => {
    return apiClient.get(`/assignments/${id}`);
  },

  createAssignment: async (assignmentData) => {
    return apiClient.post('/assignments', assignmentData);
  },

  updateAssignment: async (id, assignmentData) => {
    return apiClient.put(`/assignments/${id}`, assignmentData);
  },

  returnAssignment: async (id) => {
    return apiClient.patch(`/assignments/${id}/return`);
  },
};
