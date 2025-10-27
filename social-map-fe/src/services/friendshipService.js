import { api } from './apiClient';

/**
 * Friendship Service
 * Tất cả API endpoints cho chức năng kết bạn
 */
export const friendshipService = {
    /**
     * Gửi lời mời kết bạn
     * POST /api/friendships/send-request?receiverId={receiverId}
     */
    sendFriendRequest: async (receiverId) => {
        return await api.post('/friendships/send-request', null, {
            params: { receiverId }
        });
    },

    /**
     * Chấp nhận lời mời kết bạn
     * POST /api/friendships/accept?senderId={senderId}
     */
    acceptFriendRequest: async (senderId) => {
        return await api.post('/friendships/accept', null, {
            params: { senderId }
        });
    },

    /**
     * Từ chối lời mời kết bạn
     * POST /api/friendships/reject?senderId={senderId}
     */
    rejectFriendRequest: async (senderId) => {
        return await api.post('/friendships/reject', null, {
            params: { senderId }
        });
    },

    /**
     * Hủy lời mời kết bạn đã gửi
     * DELETE /api/friendships/cancel?receiverId={receiverId}
     */
    cancelFriendRequest: async (receiverId) => {
        return await api.delete('/friendships/cancel', {
            params: { receiverId }
        });
    },

    /**
     * Hủy kết bạn (unfriend)
     * DELETE /api/friendships/unfriend?friendId={friendId}
     */
    unfriend: async (friendId) => {
        return await api.delete('/friendships/unfriend', {
            params: { friendId }
        });
    },

    /**
     * Lấy trạng thái kết bạn với một user
     * GET /api/friendships/status?userId={userId}
     *
     * Trả về: null | 'PENDING' | 'ACCEPTED' | 'RECEIVED'
     */
    getFriendshipStatus: async (userId) => {
        try {
            const response = await api.get('/friendships/status', {
                params: { userId }
            });
            return response.status || null;
        } catch (error) {
            console.error('Failed to get friendship status:', error);
            return null;
        }
    },

    /**
     * Lấy danh sách bạn bè
     * GET /api/friendships/friends
     */
    getFriends: async () => {
        return await api.get('/friendships/friends');
    },

    /**
     * Lấy danh sách lời mời kết bạn đã nhận
     * GET /api/friendships/requests/received
     */
    getReceivedRequests: async () => {
        return await api.get('/friendships/requests/received');
    },

    /**
     * Lấy danh sách lời mời kết bạn đã gửi
     * GET /api/friendships/requests/sent
     */
    getSentRequests: async () => {
        return await api.get('/friendships/requests/sent');
    },

    /**
     * Tìm kiếm bạn bè
     * GET /api/friendships/search?query={query}
     */
    searchFriends: async (query) => {
        return await api.get('/friendships/search', {
            params: { query }
        });
    }
};

// Export default để tương thích
export default friendshipService;

