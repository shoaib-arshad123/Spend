const API_URL = 'http://localhost:5000/api';

// Helper function for API calls
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
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'API call failed');
    }

    return result;
  } catch (error) {
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

// Expense API
export const expenseAPI = {
  add: (amount, category, description, date) =>
    apiCall('/expenses', 'POST', { amount, category, description, date }),
  getAll: (startDate, endDate, category) => {
    let endpoint = '/expenses?';
    if (startDate && endDate) {
      endpoint += `startDate=${startDate}&endDate=${endDate}`;
      if (category && category !== 'all') endpoint += `&category=${category}`;
    } else if (category && category !== 'all') {
      endpoint += `category=${category}`;
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
  create: (name, icon) =>
    apiCall('/categories', 'POST', { name, icon })
};
