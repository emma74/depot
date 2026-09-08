import apiClient from './apiClient';

export const expenseService = {
  list: (params) => apiClient.get('/api/expenses', { params }).then((res) => res.data),
  create: (data) => apiClient.post('/api/expenses', data).then((res) => res.data),
  update: (id, data) => apiClient.put(`/api/expenses/${id}`, data).then((res) => res.data),
  remove: (id) => apiClient.delete(`/api/expenses/${id}`).then((res) => res.data),
};
