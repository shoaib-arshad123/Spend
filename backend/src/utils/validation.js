// IMPROVED: src/services/api.js
// Fixed: Uses environment variables instead of hardcoded URL

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

console.log('API URL:', API_URL);

// Helper function for API calls with improved error handling
const apiCall = async (endpoint, method = 'GET', data = null) => {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
    }
  };

  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, options);
    
    // Enhanced error handling
    if (response.status === 401) {
      // Token expired or invalid - clear and redirect to login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/';
      throw new Error('Session expired. Please login again.');
    }

    if (response.status === 429) {
      throw new Error('Too many requests. Please try again later.');
    }

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || `HTTP ${response.status}: API call failed`);
    }

    return result;
  } catch (error) {
    console.error(`API Error [${method} ${endpoint}]:`, error.message);
    throw error;
  }
};

// Auth API
export const authAPI = {
  register: (name, email, password) =>
    apiCall('/auth/register', 'POST', { name, email, password }),
  login: (email, password) =>
    apiCall('/auth/login', 'POST', { email, password }),
  getCurrentUser: () =>
    apiCall('/auth/me', 'GET')
};

// Expense API with pagination support
export const expenseAPI = {
  add: (amount, category, description, date) =>
    apiCall('/expenses', 'POST', { amount, category, description, date }),
  getAll: (startDate, endDate, category, page = 1, limit = 20) => {
    let endpoint = `/expenses?page=${page}&limit=${limit}`;
    if (startDate && endDate) {
      endpoint += `&startDate=${startDate}&endDate=${endDate}`;
      if (category && category !== 'all') endpoint += `&category=${category}`;
    } else if (category && category !== 'all') {
      endpoint += `&category=${category}`;
    }
    return apiCall(endpoint, 'GET');
  },
  delete: (id) =>
    apiCall(`/expenses/${id}`, 'DELETE'),
  update: (id, amount, category, description, date) =>
    apiCall(`/expenses/${id}`, 'PUT', { amount, category, description, date }),
  getStats: (month, year) => {
    let endpoint = '/expenses/stats?';
    if (month) endpoint += `month=${month}`;
    if (year) endpoint += `${month ? '&' : ''}year=${year}`;
    return apiCall(endpoint, 'GET');
  }
};

// Budget API
export const budgetAPI = {
  set: (amount) =>
    apiCall('/budget', 'POST', { amount }),
  get: () =>
    apiCall('/budget', 'GET')
};

// Profile API
export const profileAPI = {
  get: () =>
    apiCall('/profile', 'GET'),
  update: (name, language, theme) =>
    apiCall('/profile', 'PUT', { name, language, theme })
};

// Category API
export const categoryAPI = {
  getAll: () =>
    apiCall('/categories', 'GET'),
  add: (name, icon) =>
    apiCall('/categories', 'POST', { name, icon }),
  delete: (id) =>
    apiCall(`/categories/${id}`, 'DELETE')
};

// Notification API
export const notificationAPI = {
  getAll: () =>
    apiCall('/notifications', 'GET'),
  markAsRead: (id) =>
    apiCall(`/notifications/${id}`, 'PUT', { isRead: true }),
  delete: (id) =>
    apiCall(`/notifications/${id}`, 'DELETE')
};

// Rewards API
export const rewardAPI = {
  getPoints: () =>
    apiCall('/rewards', 'GET'),
  claimReward: (rewardId) =>
    apiCall(`/rewards/${rewardId}/claim`, 'POST')
};

export default {
  authAPI,
  expenseAPI,
  budgetAPI,
  profileAPI,
  categoryAPI,
  notificationAPI,
  rewardAPI
};
