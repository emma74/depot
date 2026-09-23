import apiClient from './apiClient';

export const supplierService = {
  // Each row also carries totalBalance/totalEmptiesBalance.
  list: () => apiClient.get('/api/suppliers').then((res) => res.data),
  create: (name) => apiClient.post('/api/suppliers', { name }).then((res) => res.data),
  update: (id, name) => apiClient.put(`/api/suppliers/${id}`, { name }).then((res) => res.data),
};
