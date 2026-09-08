import apiClient from './apiClient';

export const otherIncomeService = {
  list: (params) => apiClient.get('/api/other-incomes', { params }).then((res) => res.data),
  create: (data) => apiClient.post('/api/other-incomes', data).then((res) => res.data),
  update: (id, data) => apiClient.put(`/api/other-incomes/${id}`, data).then((res) => res.data),
  remove: (id) => apiClient.delete(`/api/other-incomes/${id}`).then((res) => res.data),
};
