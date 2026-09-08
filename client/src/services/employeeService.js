import apiClient from './apiClient';

export const employeeService = {
  list: () => apiClient.get('/api/employees').then((res) => res.data),
  get: (id) => apiClient.get(`/api/employees/${id}`).then((res) => res.data),
  create: (data) => apiClient.post('/api/employees', data).then((res) => res.data),
  update: (id, data) => apiClient.put(`/api/employees/${id}`, data).then((res) => res.data),
  remove: (id) => apiClient.delete(`/api/employees/${id}`).then((res) => res.data),
};
