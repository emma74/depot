import apiClient from './apiClient';

export const salesOrderService = {
  list: (params) => apiClient.get('/api/salesorders', { params }).then((res) => res.data),
  get: (id) => apiClient.get(`/api/salesorders/${id}`).then((res) => res.data),
  create: (data) => apiClient.post('/api/salesorders', data).then((res) => res.data),
  updateStatus: (id, status) =>
    apiClient.patch(`/api/salesorders/${id}/status`, { status }).then((res) => res.data),
  remove: (id) => apiClient.delete(`/api/salesorders/${id}`).then((res) => res.data),
  userSummary: (userId, params) =>
    apiClient.get(`/api/salesorders/users/${userId}/summary`, { params }).then((res) => res.data),
};
