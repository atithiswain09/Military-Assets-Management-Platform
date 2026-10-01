/**
 * Centralized API Client for AssetFlow
 * Handles HTTP requests, authentication headers, base URL configuration, and unified error handling.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export class ApiError extends Error {
  constructor(message, status, code, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Generic fetch wrapper
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('assetflow_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  try {
    const response = await fetch(url, config);

    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { message: text || response.statusText };
    }

    if (!response.ok) {
      const errorMessage = data?.message || data?.error?.message || `Request failed with status ${response.status}`;
      const errorCode = data?.error?.code || `HTTP_${response.status}`;
      const errorDetails = data?.error?.details || null;

      if (response.status === 401) {
        localStorage.removeItem('assetflow_token');
        localStorage.removeItem('assetflow_user');
      }

      throw new ApiError(errorMessage, response.status, errorCode, errorDetails);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error.message || 'Network error or backend service unavailable',
      0,
      'NETWORK_ERROR'
    );
  }
}

export const apiClient = {
  get: (url, params = {}, options = {}) => {
    const query = new URLSearchParams();
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        query.append(key, params[key]);
      }
    });
    const queryString = query.toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;
    return request(fullUrl, { method: 'GET', ...options });
  },

  post: (url, body, options = {}) => {
    return request(url, { method: 'POST', body, ...options });
  },

  put: (url, body, options = {}) => {
    return request(url, { method: 'PUT', body, ...options });
  },

  patch: (url, body = {}, options = {}) => {
    return request(url, { method: 'PATCH', body, ...options });
  },

  delete: (url, options = {}) => {
    return request(url, { method: 'DELETE', ...options });
  },
};
