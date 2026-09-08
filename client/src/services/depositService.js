import apiClient from './apiClient';

export const depositService = {
  list: (params) => apiClient.get('/api/deposits', { params }).then((res) => res.data),
  create: (data) => apiClient.post('/api/deposits', data).then((res) => res.data),
  update: (id, data) => apiClient.put(`/api/deposits/${id}`, data).then((res) => res.data),
  remove: (id) => apiClient.delete(`/api/deposits/${id}`).then((res) => res.data),
};
