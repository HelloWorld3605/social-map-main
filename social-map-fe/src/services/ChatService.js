import { api } from './apiClient';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

const BASE_URL = "http://localhost:8080";

// =================================================================
// PART 1: REST API SERVICE
// =================================================================
// Backend sẽ tự động lấy userId từ JWT token qua @AuthenticationPrincipal
// Không cần truyền userId từ frontend
// =================================================================

export const ChatService = {

    /**
     * Lấy danh sách conversations của user hiện tại
     * GET /api/conversations
     * Backend tự động lấy userId từ JWT
     */
    getUserConversations: () =>
        api.get('/conversations'),

    /**
     * Lấy conversation cụ thể
     * GET /api/conversations/{conversationId}
     */
    getConversation: (conversationId) =>
        api.get(`/conversations/${conversationId}`),

    /**
     * Lấy hoặc tạo conversation private với user khác
     * GET /api/conversations/private/{otherUserId}
     */
    getOrCreatePrivateConversation: (otherUserId) =>
        api.get(`/conversations/private/${otherUserId}`),

    /**
     * Tạo conversation mới (nhóm hoặc private)
     * POST /api/conversations
     * @param {object} data - { memberIds: string[], isGroup: boolean, groupName?: string, groupAvatar?: string }
     */
    createConversation: (data) =>
        api.post('/conversations', data),

    /**
     * Cập nhật thông tin group chat
     * PUT /api/conversations/{conversationId}/group-info
     */
    updateGroupInfo: (conversationId, { groupName, groupAvatar }) =>
        api.put(`/conversations/${conversationId}/group-info`, null, {
            params: { groupName, groupAvatar }
        }),

    /**
     * Lấy lịch sử tin nhắn của conversation (phân trang)
     * GET /api/conversations/{conversationId}/messages
     */
    getMessages: (conversationId, { page = 0, size = 50 } = {}) =>
        api.get(`/conversations/${conversationId}/messages`, {
            params: { page, size }
        }),

    /**
     * Lấy tin nhắn mới (chưa đọc)
     * GET /api/conversations/{conversationId}/messages/new
     */
    getNewMessages: (conversationId) =>
        api.get(`/conversations/${conversationId}/messages/new`),

    /**
     * Gửi tin nhắn qua REST API
     * POST /api/conversations/{conversationId}/messages
     */
    sendMessage: (conversationId, messageData) =>
        api.post(`/conversations/${conversationId}/messages`, messageData),

    /**
     * Sửa tin nhắn
     * PUT /api/messages/{messageId}
     */
    editMessage: (messageId, content) =>
        api.put(`/messages/${messageId}`, null, {
            params: { content }
        }),

    /**
     * Xóa tin nhắn
     * DELETE /api/messages/{messageId}
     */
    deleteMessage: (messageId) =>
        api.delete(`/messages/${messageId}`),

    /**
     * Search tin nhắn trong conversation
     * GET /api/conversations/{conversationId}/messages/search
     */
    searchMessages: (conversationId, query) =>
        api.get(`/conversations/${conversationId}/messages/search`, {
            params: { query }
        }),

    /**
     * Đánh dấu tin nhắn đã đọc
     * POST /api/conversations/{conversationId}/read
     */
    markAsRead: (conversationId) =>
        api.post(`/conversations/${conversationId}/read`),

    /**
     * Lấy số tin nhắn chưa đọc
     * GET /api/conversations/{conversationId}/unread-count
     */
    getUnreadCount: (conversationId) =>
        api.get(`/conversations/${conversationId}/unread-count`),

    /**
     * Lấy danh sách users đang typing
     * GET /api/conversations/{conversationId}/typing
     */
    getTypingUsers: (conversationId) =>
        api.get(`/conversations/${conversationId}/typing`),

    /**
     * Search users/friends để chat
     * GET /api/chat/search-users
     */
    searchFriendsToChat: (query) =>
        api.get('/chat/search-users', { params: { query } }),

    /**
     * Search users (general)
     * GET /api/users/search
     */
    searchAllUsers: (query, limit = 20) =>
        api.get('/users/search', { params: { query, limit } }),

    /**
     * Thêm member vào group chat
     * POST /api/conversations/{conversationId}/members/{memberId}
     */
    addMember: (conversationId, memberId) =>
        api.post(`/conversations/${conversationId}/members/${memberId}`),

    /**
     * Xóa member khỏi group chat
     * DELETE /api/conversations/{conversationId}/members/{memberId}
     */
    removeMember: (conversationId, memberId) =>
        api.delete(`/conversations/${conversationId}/members/${memberId}`),

    /**
     * Rời khỏi group chat
     * POST /api/conversations/{conversationId}/leave
     */
    leaveConversation: (conversationId) =>
        api.post(`/conversations/${conversationId}/leave`),
};

// =================================================================
// PART 2: WEBSOCKET SERVICE
// =================================================================

class WebSocketChatService {
    constructor() {
        this.stompClient = null;
        this.subscriptions = new Map();
        this.currentUserId = null; // Sẽ được set sau khi connect
    }

    /**
     * Kết nối tới WebSocket với JWT token
     */
    connect(onConnectedCallback, onErrorCallback) {
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.error('No auth token found');
            onErrorCallback?.('No authentication token');
            return;
        }

        const socket = new SockJS(`${BASE_URL}/ws`);
        this.stompClient = Stomp.over(socket);
        this.stompClient.debug = () => { };

        this.stompClient.configure({
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },
            reconnectDelay: 5000,

            onConnect: (frame) => {
                console.log('✅ WebSocket connected:', frame);

                // Lấy userId từ token response hoặc từ user info API
                this.fetchCurrentUserId().then(() => {
                    onConnectedCallback?.();
                });
            },
            onStompError: (frame) => {
                console.error('STOMP error:', frame.headers['message'], frame.body);
                onErrorCallback?.(frame.headers['message']);
            },
            onWebSocketError: (event) => {
                console.error('WebSocket error:', event);
                onErrorCallback?.('WebSocket connection error');
            }
        });

        this.stompClient.activate();
    }

    /**
     * Lấy current user ID từ JWT token
     * Parse trực tiếp từ token thay vì gọi API để tránh lỗi timing
     */
    async fetchCurrentUserId() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.error('No auth token found');
            return;
        }

        try {
            // Parse userId từ JWT token (client-side)
            const payload = JSON.parse(atob(token.split('.')[1]));

            // JWT token của bạn có thể chứa userId hoặc sub (subject)
            // Thử cả 2 trường hợp
            this.currentUserId = payload.userId || payload.id || payload.sub;

            console.log('✅ Current user ID from JWT:', this.currentUserId);

            // Nếu không có userId trong token, thử gọi API
            if (!this.currentUserId) {
                try {
                    const response = await api.get('/users/me');
                    this.currentUserId = response.id;
                    console.log('✅ Current user ID from API:', this.currentUserId);
                } catch (error) {
                    console.error('Failed to fetch user from API, using email as fallback');
                    // Fallback: dùng email (sub) nếu không có userId
                    this.currentUserId = payload.sub;
                }
            }
        } catch (e) {
            console.error('Failed to parse JWT token:', e);
        }
    }

    /**
     * Get current user ID
     */
    getCurrentUserId() {
        return this.currentUserId;
    }

    disconnect() {
        this.stompClient?.deactivate();
        this.subscriptions.clear();
        this.currentUserId = null;
        console.log('WebSocket disconnected');
    }

    subscribe(destination, callback) {
        if (this.subscriptions.has(destination)) return;
        const sub = this.stompClient.subscribe(destination, msg => {
            callback(JSON.parse(msg.body));
        });
        this.subscriptions.set(destination, sub);
    }


    unsubscribe(destination) {
        const sub = this.subscriptions.get(destination);
        sub?.unsubscribe();
        this.subscriptions.delete(destination);
    }

    /**
     * Subscribe to conversation updates
     */
    subscribeToConversation(conversationId, onMessage, onTyping, onUpdate) {
        if (!this.stompClient?.connected) return;

        const msgPath = `/topic/conversation/${conversationId}`;
        this.subscribe(msgPath, onMessage);

        const typingPath = `/topic/conversation/${conversationId}/typing`;
        this.subscribe(typingPath, onTyping);

        const updatePath = `/topic/conversation/${conversationId}/update`;
        this.subscribe(updatePath, onUpdate);
    }

    /**
     * Subscribe to user's private queue
     */
    subscribeToUserQueue(onUnread, onError) {
        if (!this.stompClient?.connected) return;

        this.subscribe('/user/queue/unread', onUnread);
        this.subscribe('/user/queue/errors', (error) => {
            onError?.(typeof error === 'string' ? error : JSON.stringify(error));
        });
    }

    /**
     * Gửi tin nhắn qua WebSocket
     * Backend sẽ tự động lấy senderId từ JWT token
     */
    sendChatMessage({ conversationId, content, messageType = 'TEXT', recipientId }) {
        this.stompClient?.publish({
            destination: '/app/sendMessage',
            body: JSON.stringify({
                conversationId,
                content,
                messageType,
                recipientId
                // Không cần senderId - backend sẽ lấy từ SecurityContext
            })
        });
    }

    /**
     * Gửi typing status
     * Backend sẽ tự động lấy userId từ JWT token
     */
    sendTypingStatus({ conversationId, isTyping }) {
        this.stompClient?.publish({
            destination: '/app/typing',
            body: JSON.stringify({
                conversationId,
                isTyping
                // Không cần userId - backend sẽ lấy từ SecurityContext
            })
        });
    }
}

export const webSocketService = new WebSocketChatService();