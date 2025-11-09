// src/services/WebSocketChatService.js
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { notificationSoundService } from './notificationSoundService';

const BASE_URL = "http://localhost:8080";

class WebSocketChatService {
    stompClient = null;
    subscriptions = new Map(); // Map<destination, Set<{sub, callback}>>
    reconnectCallbacks = { onConnected: null, onError: null };
    connecting = false;

     // 🆕 Thêm các biến cho auto-reconnect và heartbeat
    reconnectAttempts = 0;
    maxReconnectAttempts = 5;
    reconnectTimer = null;
    heartbeatTimer = null;
    lastHeartbeat = Date.now();
    isVisible = true;
    // 🆕 Theo dõi thời gian disconnect để xử lý tin nhắn mới sau reconnect
    lastDisconnectTime = null;
    hasNewMessagesAfterReconnect = false;

    constructor() {
        // 🆕 Lắng nghe visibility change để xử lý khi user chuyển tab
        this.setupVisibilityListener();
        // 🆕 Bắt đầu heartbeat
        this.startHeartbeat();
    }

    // 🆕 Setup visibility API listener
    setupVisibilityListener() {
        document.addEventListener('visibilitychange', () => {
            this.isVisible = !document.hidden;
            console.log(`[WebSocket] Tab visibility changed: ${this.isVisible ? 'visible' : 'hidden'}`);

            if (this.isVisible) {
                // Khi user quay lại tab, kiểm tra kết nối
                this.handleVisibilityReturn();
            }
        });
    }

    // 🆕 Xử lý khi user quay lại tab
    handleVisibilityReturn() {
        const now = Date.now();
        const timeAway = now - this.lastHeartbeat;

        // Nếu đã away quá lâu (> 30 giây) hoặc socket không connected
        if (timeAway > 30000 || !this.isConnected()) {
            console.log('🧠 Tab active again, checking connection...');
            if (!this.isConnected()) {
                console.log('🔄 Socket lost, reconnecting...');
                this.attemptReconnect();
            } else {
                // Kiểm tra heartbeat
                this.sendHeartbeat();
            }
        }
    }

    // 🆕 Heartbeat mechanism
    startHeartbeat() {
        this.heartbeatTimer = setInterval(() => {
            if (this.isConnected() && this.isVisible) {
                this.sendHeartbeat();
            }
        }, 30000); // Mỗi 30 giây
    }

    // 🆕 Gửi heartbeat để kiểm tra kết nối
    sendHeartbeat() {
        if (!this.isConnected()) return;

        this.lastHeartbeat = Date.now();
        // Gửi ping message
        this.send('/app/ping', { timestamp: this.lastHeartbeat });
    }

    // 🆕 Dừng heartbeat
    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    connect(onConnected, onError) {
        // Store callbacks for reconnection
        this.reconnectCallbacks = { onConnected, onError };

        // Get fresh token from localStorage
        const token = localStorage.getItem('authToken');

        if (!token) {
            console.error('[WebSocket] No auth token found!');
            onError?.('No auth token');
            return;
        }

        console.log('[WebSocket] Connecting with token (length):', token?.length);

        // Disconnect existing connection if any
        if (this.stompClient?.connected) {
            console.log('[WebSocket] Disconnecting existing connection before reconnect');
            this.disconnect();
        }

        this.connecting = true;

        // ✅ Sử dụng Client API mới - hỗ trợ auto-reconnect chính thức
        this.stompClient = new Client({
            // WebSocket factory để sử dụng SockJS
            webSocketFactory: () => new SockJS(`${BASE_URL}/ws`),

            connectHeaders: {
                Authorization: `Bearer ${token}`,
            },

            // 🆕 Tắt auto-reconnect mặc định, dùng custom logic
            reconnectDelay: 0,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,

            debug: (msg) => {
                // Chỉ log errors và warnings, bỏ qua debug messages
                if (msg.includes('ERROR') || msg.includes('WARN')) {
                    console.log('[STOMP]', msg);
                }
            },

            onConnect: () => {
                console.log("✅ Connected to WebSocket");
                this.connecting = false;
                this.reconnectAttempts = 0; // Reset reconnect attempts

                // 🆕 Kiểm tra và phát âm thanh cho tin nhắn mới sau reconnect
                this.handleReconnectNotifications();

                // Dispatch event để notify components khác
                window.dispatchEvent(new CustomEvent('websocket-connected'));

                onConnected?.();
            },

            onStompError: (frame) => {
                console.error("❌ STOMP error:", frame);
                this.connecting = false;

                // Check if error is due to authentication
                if (frame.headers?.message?.includes('Authentication')) {
                    console.error('[WebSocket] Authentication failed - token may be expired');
                    this.handleAuthError();
                } else {
                    // 🆕 Thử reconnect cho các lỗi khác
                    this.attemptReconnect();
                }

                onError?.(frame);
            },

            onWebSocketError: (error) => {
                console.error("❌ WebSocket error:", error);
                this.connecting = false;
                // 🆕 Thử reconnect
                this.attemptReconnect();
            },

            onDisconnect: () => {
                console.log('🔌 WebSocket disconnected');
                this.connecting = false;
                // 🆕 Ghi lại thời gian disconnect
                this.lastDisconnectTime = Date.now();
                this.hasNewMessagesAfterReconnect = false;
                // 🆕 Thử reconnect
                this.attemptReconnect();
            }
        });

        this.stompClient.activate();
    }

    // 🆕 Custom reconnect với exponential backoff
    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error(`[WebSocket] Max reconnect attempts (${this.maxReconnectAttempts}) reached`);
            // Có thể emit event để app xử lý (ví dụ reload page)
            window.dispatchEvent(new CustomEvent('websocket-max-reconnect-reached'));
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff, max 30s

        console.log(`[WebSocket] Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

        this.reconnectTimer = setTimeout(() => {
            if (!this.isConnected() && !this.connecting) {
                const { onConnected, onError } = this.reconnectCallbacks;
                this.connect(onConnected, onError);
            }
        }, delay);
    }

    // 🆕 Cancel pending reconnect
    cancelReconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }

    /**
     * Reconnect with fresh token (called after token refresh)
     */
    reconnect() {
        console.log('[WebSocket] Reconnecting with fresh token...');
        const { onConnected, onError } = this.reconnectCallbacks;
        this.connect(onConnected, onError);
    }

    /**
     * Handle authentication error - could trigger app-wide token refresh
     */
    handleAuthError() {
        console.warn('[WebSocket] Handling auth error - may need to refresh token');
        // Emit custom event that app can listen to
        window.dispatchEvent(new CustomEvent('websocket-auth-error', {
            detail: { message: 'WebSocket authentication failed' }
        }));
    }

    disconnect() {
        // 🆕 Cancel pending reconnect và dừng heartbeat
        this.cancelReconnect();
        this.stopHeartbeat();

        // Unsubscribe all before deactivating
        this.subscriptions.forEach((callbacks) => {
            callbacks.forEach(({ sub }) => sub?.unsubscribe());
        });
        this.subscriptions.clear();
        this.stompClient?.deactivate();
    }

    subscribe(destination, callback) {
        if (!this.stompClient) {
            console.warn('[WebSocket] Cannot subscribe, client not initialized');
            return;
        }

        // Get or create callbacks set for this destination
        if (!this.subscriptions.has(destination)) {
            this.subscriptions.set(destination, new Set());
        }

        const callbacks = this.subscriptions.get(destination);

        // Check if this exact callback is already subscribed
        const existing = Array.from(callbacks).find(item => item.callback === callback);
        if (existing) {
            console.log(`[WebSocket] Callback already subscribed to ${destination}`);
            return;
        }

        // Create new subscription
        const sub = this.stompClient.subscribe(destination, msg => {
            try {
                const data = JSON.parse(msg.body);
                callback(data);
            } catch (error) {
                console.error('[WebSocket] Error parsing message:', error);
            }
        });

        callbacks.add({ sub, callback });
        console.log(`[WebSocket] Subscribed to ${destination}, total callbacks: ${callbacks.size}`);
    }

    unsubscribe(destination, callback) {
        const callbacks = this.subscriptions.get(destination);
        if (!callbacks) {
            console.log(`[WebSocket] No subscriptions found for ${destination}`);
            return;
        }

        // Find and remove the specific callback
        const item = Array.from(callbacks).find(item => item.callback === callback);
        if (item) {
            item.sub?.unsubscribe();
            callbacks.delete(item);
            console.log(`[WebSocket] Unsubscribed callback from ${destination}, remaining: ${callbacks.size}`);

            // If no more callbacks, remove the destination entry
            if (callbacks.size === 0) {
                this.subscriptions.delete(destination);
                console.log(`[WebSocket] Removed destination ${destination} (no more callbacks)`);
            }
        } else {
            console.log(`[WebSocket] Callback not found for ${destination}`);
        }
    }

    // Unsubscribe all callbacks for a destination
    unsubscribeAll(destination) {
        const callbacks = this.subscriptions.get(destination);
        if (callbacks) {
            callbacks.forEach(({ sub }) => sub?.unsubscribe());
            this.subscriptions.delete(destination);
            console.log(`[WebSocket] Unsubscribed all callbacks from ${destination}`);
        }
    }

    send(destination, payload) {
        if (!this.stompClient?.connected) {
            console.warn('[WebSocket] Cannot send, not connected');
            return;
        }
        this.stompClient.publish({
            destination,
            body: JSON.stringify(payload)
        });
    }

    /**
     * Get current user ID from JWT token
     */
    getCurrentUserId() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.warn('[WebSocket] getCurrentUserId: No authToken found');
            return null;
        }

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const userId = payload.userId || payload.sub;
            console.log('[WebSocket] getCurrentUserId:', userId, 'from payload:', payload);
            return userId;
        } catch (error) {
            console.error('[WebSocket] Error parsing token:', error);
            return null;
        }
    }

    /**
     * Subscribe to conversation updates (messages, typing, updates)
     */
    subscribeToConversation(conversationId, onMessage, onTyping, onUpdate) {
        if (!this.stompClient?.connected) {
            console.warn('[WebSocket] Cannot subscribe to conversation, not connected');
            return;
        }

        const msgPath = `/topic/conversation/${conversationId}`;
        if (onMessage) {
            // 🆕 Wrap onMessage callback để phát âm thanh khi nhận tin nhắn mới
            const wrappedOnMessage = (message) => {
                // Phát âm thanh thông báo nếu tin nhắn không phải từ user hiện tại
                this.handleNewMessage(message);
                onMessage(message);
            };
            this.subscribe(msgPath, wrappedOnMessage);
        }

        const typingPath = `/topic/conversation/${conversationId}/typing`;
        if (onTyping) this.subscribe(typingPath, onTyping);

        const updatePath = `/topic/conversation/${conversationId}/update`;
        if (onUpdate) this.subscribe(updatePath, onUpdate);
    }

    // 🆕 Xử lý tin nhắn mới và phát âm thanh
    handleNewMessage(message, options = {}) {
        try {
            const currentUserId = this.getCurrentUserId();

            // Kiểm tra xem tin nhắn có phải từ user hiện tại không
            if (message.senderId === currentUserId) {
                console.log('[WebSocket] Message from current user, skipping notification sound');
                return;
            }

            // Nếu vừa reconnect và tin nhắn này đến sau khi disconnect
            if (this.lastDisconnectTime && message.timestamp > this.lastDisconnectTime) {
                this.hasNewMessagesAfterReconnect = true;
                console.log('[WebSocket] New message after reconnect detected');
            }

            // Phát âm thanh với các điều kiện phù hợp
            const { chatWindowOpening = false } = options;

            // 🆕 Luôn phát âm thanh cho tin nhắn mới, nhưng có thể điều chỉnh volume
            const shouldPlayLoud = !document.hasFocus() || !this.isVisible || chatWindowOpening;

            notificationSoundService.play({
                force: true,  // Luôn phát âm thanh cho tin nhắn mới
                checkVisibility: false,  // Không kiểm tra visibility
                checkFocus: false,       // Không kiểm tra focus
                checkMinimized: false,   // Không kiểm tra minimize
                checkChatOpen: false,    // Không kiểm tra chat window
                checkTabActive: false    // Không kiểm tra tab active
            });

            console.log('🔊 Notification sound played for new message', { shouldPlayLoud });
        } catch (error) {
            console.error('[WebSocket] Error handling new message:', error);
        }
    }

    // 🆕 Xử lý thông báo sau khi reconnect
    handleReconnectNotifications() {
        // Nếu vừa reconnect và có tin nhắn mới chưa đọc
        if (this.lastDisconnectTime && this.hasNewMessagesAfterReconnect) {
            console.log('🔄 Reconnected with new messages, playing notification sound');

            // Phát âm thanh thông báo có tin nhắn mới
            notificationSoundService.play({
                force: true // Force play để thông báo có tin nhắn mới sau reconnect
            });

            // Reset flags
            this.hasNewMessagesAfterReconnect = false;
        }
    }

    /**
     * Subscribe to user's private queue for unread counts
     */
    subscribeToUserQueue(onUnread, onError) {
        if (!this.stompClient?.connected) {
            console.warn('[WebSocket] Cannot subscribe to user queue, not connected');
            return;
        }

        this.subscribe('/user/queue/unread', onUnread);
        this.subscribe('/user/queue/errors', (error) => {
            onError?.(typeof error === 'string' ? error : JSON.stringify(error));
        });
    }

    /**
     * Subscribe to user's private queue for conversation updates
     */
    subscribeToConversationUpdates(onUpdate, onError) {
        if (!this.stompClient?.connected) {
            console.warn('[WebSocket] Cannot subscribe to conversation updates, not connected');
            return;
        }

        this.subscribe('/user/queue/conversation-update', onUpdate);
        this.subscribe('/user/queue/errors', (error) => {
            onError?.(typeof error === 'string' ? error : JSON.stringify(error));
        });
    }

    /**
     * Send chat message via WebSocket
     */
    sendChatMessage({ conversationId, content, messageType = 'TEXT', recipientId }) {
        if (!this.stompClient?.connected) {
            console.error('[WebSocket] Cannot send message, not connected');
            return;
        }

        this.stompClient.publish({
            destination: '/app/sendMessage',
            body: JSON.stringify({
                conversationId,
                content,
                messageType,
                recipientId
            })
        });
    }

    /**
     * Send typing status
     */
    sendTypingStatus({ conversationId, isTyping }) {
        console.log('[WebSocket] sendTypingStatus called:', { conversationId, isTyping });
        if (!this.stompClient?.connected) {
            console.error('[WebSocket] Cannot send typing status, not connected');
            return;
        }

        try {
            this.stompClient.publish({
                destination: '/app/typing',
                body: JSON.stringify({
                    conversationId,
                    typing: isTyping,
                    isTyping: isTyping
                })
            });
            console.log('[WebSocket] Typing status sent successfully');
        } catch (error) {
            console.error('[WebSocket] Error sending typing status:', error);
        }
    }

    /**
     * Send mark as read request
     */
    sendMarkAsRead({ conversationId }) {
        if (!this.stompClient?.connected) {
            console.error('[WebSocket] Cannot send mark as read, not connected');
            return;
        }

        try {
            this.stompClient.publish({
                destination: '/app/markAsRead',
                body: JSON.stringify({ conversationId })
            });
            console.log('[WebSocket] Mark as read sent successfully');
        } catch (error) {
            console.error('[WebSocket] Error sending mark as read:', error);
        }
    }

    /**
     * Subscribe to message status updates (Facebook-style)
     * Receives updates when messages are seen by recipients
     */
    subscribeToMessageStatus(onMessageStatusUpdate) {
        if (!this.stompClient?.connected) {
            console.warn('[WebSocket] Cannot subscribe to message status, not connected');
            return;
        }

        this.subscribe('/user/queue/message-status', (statusUpdate) => {
            console.log('📬 Message status update received:', statusUpdate);
            onMessageStatusUpdate?.(statusUpdate);
        });
    }

    /**
     * Subscribe to read receipts
     */
    subscribeToReadReceipts(onReadReceipt) {
        if (!this.stompClient?.connected) {
            console.warn('[WebSocket] Cannot subscribe to read receipts, not connected');
            return;
        }

        this.subscribe('/user/queue/read-receipt', (receipt) => {
            console.log('📬 Read receipt received:', receipt);
            onReadReceipt?.(receipt);
        });
    }

    // 🆕 Kiểm tra trạng thái kết nối
    isConnected() {
        return this.stompClient?.connected && !this.connecting;
    }

    // 🆕 Kiểm tra có đang kết nối không
    isConnecting() {
        return this.connecting;
    }
}

export const webSocketService = new WebSocketChatService();
