import apiClient from './apiClient';

export const productTotalService = {
  // params: { type: 'purchase' | 'sales', startDate, endDate, product, userId? }
  getTotal: (params) =>
    apiClient.get('/api/product-total/total-products', { params }).then((res) => res.data),
};
