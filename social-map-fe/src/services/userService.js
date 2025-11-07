import { api } from './apiClient';

export const userService = {
    /**
     * Lấy profile người dùng theo ID
     * GET /api/users/{id}
     */
    getProfile: async (userId) => {
        return await api.get(`/users/${userId}`);
    },

    /**
     * Lấy profile của chính mình (dựa vào JWT)
     * GET /api/users/me
     */
    getMyProfile: async () => {
        return await api.get('/users/me');
    },

    /**
     * Cập nhật profile của chính mình (dựa vào JWT)
     * PUT /api/users/me
     */
    updateMyProfile: async (data) => {
        return await api.put('/users/me', data);
    },

    /**
     * Xóa tài khoản của chính mình (dựa vào JWT)
     * DELETE /api/users/me
     */
    deleteMyAccount: async () => {
        return await api.delete('/users/me');
    },

    /**
     * Đếm số bạn chung giữa mình và user khác (dựa vào JWT)
     * GET /api/users/me/mutual-friends/{otherUserId}/count
     */
    getMutualFriendsCount: async (otherUserId) => {
        return await api.get(`/users/me/mutual-friends/${otherUserId}/count`);
    },

    /**
     * Lấy trạng thái hoạt động của người dùng
     * GET /api/users/{id}/status
     */
    getUserStatus: async (userId) => {
        return await api.get(`/users/${userId}/status`);
    },
};

// Export default để tương thích
export default userService;
