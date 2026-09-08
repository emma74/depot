import apiClient from './apiClient';

export const reportService = {
  // params: { startDate, endDate }
  profitAndLoss: (params) =>
    apiClient.get('/api/profit-and-loss', { params }).then((res) => res.data),
};
