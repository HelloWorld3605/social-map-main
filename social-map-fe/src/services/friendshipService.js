import { api } from './apiClient';

/**
 * Friendship Service
 * Tất cả API endpoints cho chức năng kết bạn
 */
export const friendshipService = {
    /**
     * Gửi lời mời kết bạn
     * POST /api/friends/request
     */
    sendFriendRequest: async (receiverId) => {
        return await api.post('/friends/request', {
            receiverId: receiverId
        });
    },

    /**
     * Chấp nhận lời mời kết bạn
     * PUT /api/friends/{friendshipId}/accept
     */
    acceptFriendRequest: async (friendshipId) => {
        return await api.put(`/friends/${friendshipId}/accept`);
    },

    /**
     * Từ chối/Hủy lời mời kết bạn
     * DELETE /api/friends/{friendshipId}
     */
    cancelFriendRequest: async (friendshipId) => {
        return await api.delete(`/friends/${friendshipId}`);
    },

    /**
     * Hủy kết bạn (unfriend)
     * DELETE /api/friends/unfriend/{friendId}
     */
    unfriend: async (friendId) => {
        return await api.delete(`/friends/unfriend/${friendId}`);
    },

    /**
     * Lấy trạng thái kết bạn với một user
     * GET /api/friends/status/{userId}
     *
     * Trả về: 'NONE' | 'PENDING' | 'ACCEPTED' | 'RECEIVED' | 'BLOCKED' | 'SELF'
     */
    getFriendshipStatus: async (userId) => {
        try {
            return await api.get(`/friends/status/${userId}`);
        } catch (error) {
            console.error('Failed to get friendship status:', error);
            return 'NONE';
        }
    },

    /**
     * Lấy danh sách bạn bè của mình
     * GET /api/friends/list/me
     */
    getMyFriends: async () => {
        return await api.get('/friends/list/me');
    },

    /**
     * Lấy danh sách bạn bè của user khác
     * GET /api/friends/list/{userId}
     */
    getFriends: async (userId) => {
        return await api.get(`/friends/list/${userId}`);
    },

    /**
     * Lấy danh sách lời mời kết bạn đã nhận (pending requests)
     * GET /api/friends/pending/me
     */
    getPendingRequests: async () => {
        return await api.get('/friends/pending/me');
    },

    /**
     * Lấy danh sách lời mời kết bạn đã gửi (sent requests)
     * GET /api/friends/sent/me
     */
    getSentRequests: async () => {
        return await api.get('/friends/sent/me');
    }
};

// Export default để tương thích
export default friendshipService;
