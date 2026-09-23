import apiClient from './apiClient';

export const returnService = {
  // returns for a given sales order
  listForOrder: (salesOrderId) =>
    apiClient.get(`/api/returns/${salesOrderId}`).then((res) => res.data),
  create: (salesOrderId, data) =>
    apiClient.post(`/api/returns/${salesOrderId}`, data).then((res) => res.data),
  // `id` is the return's own id, not the sales order's
  update: (id, data) => apiClient.put(`/api/returns/${id}`, data).then((res) => res.data),
  remove: (id) => apiClient.delete(`/api/returns/${id}`).then((res) => res.data),
};
