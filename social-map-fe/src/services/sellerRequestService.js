import { api } from './apiClient';

// User - Tạo seller request
export const createSellerRequest = async (requestData) => {
  return await api.post('/seller-requests', requestData);
};

// User - Lấy seller request của user hiện tại
export const getMySellerRequests = async () => {
  return await api.get('/seller-requests/my-requests');
};

// Lấy chi tiết một seller request
export const getSellerRequestById = async (requestId) => {
  return await api.get(`/seller-requests/${requestId}`);
};

// Admin - Lấy danh sách seller requests
export const getSellerRequests = async (status = null) => {
  const params = status ? { status } : {};
  return await api.get('/admin/seller-requests', { params }); // api.get already returns response.data
};

// Admin - Chấp nhận seller request
export const approveSellerRequest = async (requestId) => {
  return await api.put(`/admin/seller-requests/${requestId}/approve`);
};

// Admin - Từ chối seller request
export const rejectSellerRequest = async (requestId, reason) => {
  return await api.put(`/admin/seller-requests/${requestId}/reject`, null, {
    params: { reason }
  });
};
