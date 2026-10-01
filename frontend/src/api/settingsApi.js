import { apiClient } from './client';

export const settingsApi = {
  getSettings: async () => {
    return apiClient.get('/auth/settings');
  },

  updateSettings: async (settingsData) => {
    return apiClient.put('/auth/settings', settingsData);
  },

  changePassword: async ({ currentPassword, newPassword, confirmPassword }) => {
    return apiClient.put('/auth/change-password', { currentPassword, newPassword, confirmPassword });
  },

  toggle2FA: async (enabled) => {
    return apiClient.post('/auth/2fa/toggle', { enabled });
  },

  getSessions: async () => {
    return apiClient.get('/auth/sessions');
  },

  revokeSession: async (sessionId) => {
    return apiClient.delete(`/auth/sessions/${sessionId}`);
  },

  exportUserData: async () => {
    const token = localStorage.getItem('assetflow_token');
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

    const response = await fetch(`${baseUrl}/auth/export-data`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      let message = 'Export failed. Unable to fetch account data.';
      try {
        const data = await response.json();
        if (data?.message) message = data.message;
        else if (data?.error?.message) message = data.error.message;
      } catch (_) {}
      throw new Error(message);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assetflow_account_data_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    return { success: true, message: 'Account data exported successfully' };
  },
};
