import { api } from './apiClient';

// Lấy thống kê dashboard
export const getDashboardStats = async () => {
  return await api.get('/admin/dashboard/stats'); // api.get already returns response.data
};

// Quản lý users
export const getAllUsers = async (page = 0, size = 10, sortBy = 'createdAt', sortDirection = 'DESC', search = '', includeDeleted = false) => {
  const params = { page, size, sortBy, sortDirection };
  if (search) params.search = search;
  if (includeDeleted) params.includeDeleted = includeDeleted;
  return await api.get('/admin/users', { params });
};

export const updateUser = async (userId, data) => {
  return await api.put(`/admin/users/${userId}`, data);
};

export const deleteUser = async (userId) => {
  return await api.delete(`/admin/users/${userId}`);
};

export const restoreUser = async (userId) => {
  return await api.put(`/admin/users/${userId}/restore`);
};

export const updateUserRole = async (userId, role) => {
  return await api.put(`/admin/users/${userId}/role`, { role });
};

// Quản lý shops
export const getAllShopsAdmin = async () => {
  return await api.get('/admin/shops');
};

export const deleteShopAdmin = async (shopId) => {
  return await api.delete(`/admin/shops/${shopId}`);
};

export const updateShopStatus = async (shopId, status) => {
  return await api.put(`/admin/shops/${shopId}/status`, { status });
};

