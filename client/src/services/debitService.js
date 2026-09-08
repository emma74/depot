import apiClient from './apiClient';

export const debitService = {
  list: (params) => apiClient.get('/api/checkdebit', { params }).then((res) => res.data),
  create: (data) => apiClient.post('/api/checkdebit', data).then((res) => res.data),
  update: (id, data) => apiClient.put(`/api/checkdebit/${id}`, data).then((res) => res.data),
  remove: (id) => apiClient.delete(`/api/checkdebit/${id}`).then((res) => res.data),
};
