import apiClient from './apiClient';

export const purchaseOrderService = {
  list: (params) => apiClient.get('/api/purchases', { params }).then((res) => res.data),
  get: (id) => apiClient.get(`/api/purchases/${id}`).then((res) => res.data),
  create: (data) => apiClient.post('/api/purchases', data).then((res) => res.data),
  update: (id, data) => apiClient.put(`/api/purchases/${id}`, data).then((res) => res.data),
};
