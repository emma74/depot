import apiClient from './apiClient';

export const customerService = {
  list: () => apiClient.get('/api/customers').then((res) => res.data),
  get: (id) => apiClient.get(`/api/customers/${id}`).then((res) => res.data),
  create: (data) => apiClient.post('/api/customers', data).then((res) => res.data),
  update: (id, data) => apiClient.put(`/api/customers/${id}`, data).then((res) => res.data),
  remove: (id) => apiClient.delete(`/api/customers/${id}`).then((res) => res.data),
  ordersSummary: (userId, params) =>
    apiClient.get(`/api/customers/orders/${userId}/summary`, { params }).then((res) => res.data),
};
