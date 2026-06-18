import { api } from './apiClient';

export const notificationService = {
  // Lấy danh sách tất cả thông báo
  getNotifications: async () => {
    return await api.get('/notifications');
  },

  // Lấy số lượng thông báo chưa đọc
  getUnreadCount: async () => {
    return await api.get('/notifications/unread-count');
  },

  // Đánh dấu một thông báo đã đọc
  markAsRead: async (notificationId) => {
    return await api.put(`/notifications/${notificationId}/read`);
  },

  // Đánh dấu tất cả thông báo đã đọc
  markAllAsRead: async () => {
    return await api.put('/notifications/read-all');
  },

  // Xóa một thông báo
  deleteNotification: async (notificationId) => {
    return await api.delete(`/notifications/${notificationId}`);
  }
};
