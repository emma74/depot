import apiClient from './apiClient';

export const targetService = {
  // params: { startDate, endDate, targetValue }
  getProgress: (params) => apiClient.get('/api/target', { params }).then((res) => res.data),
};
