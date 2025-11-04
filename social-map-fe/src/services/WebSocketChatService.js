// src/services/WebSocketChatService.js
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

const BASE_URL = "http://localhost:8080";

class WebSocketChatService {
    stompClient = null;
    subscriptions = new Map(); // Map<destination, Set<{sub, callback}>>

    connect(onConnected, onError) {
        const token = localStorage.getItem('authToken');
        console.log('[WebSocket] Using token:', token);
        const socket = new SockJS(`${BASE_URL}/ws`);
        this.stompClient = Stomp.over(socket);
        this.stompClient.debug = () => { };

        this.stompClient.configure({
            connectHeaders: {
                Authorization: `Bearer ${token}`,
            },
            reconnectDelay: 5000,
            onConnect: () => {
                console.log("✅ Connected to WebSocket");
                onConnected?.();
            },
            onStompError: (frame) => {
                console.error("STOMP error:", frame);
                onError?.(frame);
            }
        });

        this.stompClient.activate();
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
}

export const webSocketService = new WebSocketChatService();
