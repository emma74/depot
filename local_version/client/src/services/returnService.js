import apiClient from './apiClient';

export const returnService = {
  // returns for a given sales order
  listForOrder: (salesOrderId) =>
    apiClient.get(`/api/returns/${salesOrderId}`).then((res) => res.data),
  create: (salesOrderId, data) =>
    apiClient.post(`/api/returns/${salesOrderId}`, data).then((res) => res.data),
};
