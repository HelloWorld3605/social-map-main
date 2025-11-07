// src/services/WebSocketChatService.js
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

const BASE_URL = "http://localhost:8080";

class WebSocketChatService {
    stompClient = null;
    subscriptions = new Map(); // Map<destination, Set<{sub, callback}>>
    reconnectCallbacks = { onConnected: null, onError: null };
    isConnecting = false;

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

        this.isConnecting = true;

        // ✅ Sử dụng Client API mới - hỗ trợ auto-reconnect chính thức
        this.stompClient = new Client({
            // WebSocket factory để sử dụng SockJS
            webSocketFactory: () => new SockJS(`${BASE_URL}/ws`),

            connectHeaders: {
                Authorization: `Bearer ${token}`,
            },

            reconnectDelay: 5000, // Tự động reconnect sau 5s nếu mất kết nối
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
                this.isConnecting = false;

                // Dispatch event để notify components khác
                window.dispatchEvent(new CustomEvent('websocket-connected'));

                onConnected?.();
            },

            onStompError: (frame) => {
                console.error("❌ STOMP error:", frame);
                this.isConnecting = false;

                // Check if error is due to authentication
                if (frame.headers?.message?.includes('Authentication')) {
                    console.error('[WebSocket] Authentication failed - token may be expired');
                    this.handleAuthError();
                }

                onError?.(frame);
            },

            onWebSocketError: (error) => {
                console.error("❌ WebSocket error:", error);
                this.isConnecting = false;
            },

            onDisconnect: () => {
                console.log('🔌 WebSocket disconnected');
                this.isConnecting = false;
            }
        });

        this.stompClient.activate();
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
        if (onMessage) this.subscribe(msgPath, onMessage);

        const typingPath = `/topic/conversation/${conversationId}/typing`;
        if (onTyping) this.subscribe(typingPath, onTyping);

        const updatePath = `/topic/conversation/${conversationId}/update`;
        if (onUpdate) this.subscribe(updatePath, onUpdate);
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
}

export const webSocketService = new WebSocketChatService();
