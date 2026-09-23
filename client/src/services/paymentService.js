import apiClient from './apiClient';

export const paymentService = {
  // Record a new payment against a sales or purchase order. Previous payments on the same
  // order are untouched — each payment is its own entry.
  create: (data) => apiClient.post('/api/payments', data).then((res) => res.data),
  // Edit one specific payment (by its own id) — its amount, date, or check details.
  update: (id, data) => apiClient.put(`/api/payments/${id}`, data).then((res) => res.data),
  remove: (id) => apiClient.delete(`/api/payments/${id}`).then((res) => res.data),
  userSummary: (userId, params) =>
    apiClient.get(`/api/payments/${userId}/summary`, { params }).then((res) => res.data),
};
