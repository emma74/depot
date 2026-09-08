import apiClient from './apiClient';

export const userService = {
  getMe: () => apiClient.get('/api/users/me').then((res) => res.data),
  list: () => apiClient.get('/api/users').then((res) => res.data),
  updateRole: (id, role) =>
    apiClient.patch(`/api/users/${id}/role`, { role }).then((res) => res.data),
  resetPassword: (id, newPassword) =>
    apiClient.patch(`/api/users/${id}/password`, { newPassword }).then((res) => res.data),
};
