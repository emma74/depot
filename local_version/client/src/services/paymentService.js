import apiClient from './apiClient';

export const paymentService = {
  // Reconcile a payment against a sales or purchase order
  update: (data) => apiClient.patch('/api/payments', data).then((res) => res.data),
  userSummary: (userId, params) =>
    apiClient.get(`/api/payments/${userId}/summary`, { params }).then((res) => res.data),
};
