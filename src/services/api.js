import {
  authApi, expenseApi, budgetApi, profileApi, categoryApi
} from './supabaseApi';

export const authAPI = {
  register: (name, email, password) => authApi.register(name, email, password),
  login: (email, password) => authApi.login(email, password),
  getCurrentUser: () => authApi.me(),
};

export const expenseAPI = {
  add: (amount, category, description, date) =>
    expenseApi.add({ amount, category, description, date }),
  getAll: () => expenseApi.getAll(),
  delete: (id) => expenseApi.delete(id),
  update: (id, amount, category, description, date) =>
    expenseApi.update(id, { amount, category, description, date }),
  getStats: () => expenseApi.getAll(),
};

export const budgetAPI = {
  set: (amount) => budgetApi.set(amount),
  get: () => budgetApi.get(),
};

export const profileAPI = {
  get: () => profileApi.get(),
  update: (name, language, theme) => profileApi.update({ name, language, theme }),
};

export const categoryAPI = {
  getAll: () => categoryApi.getAll(),
  create: (name, icon) => categoryApi.create(name, icon),
};
