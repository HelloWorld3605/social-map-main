// src/services/WebSocketChatService.js
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

const BASE_URL = "http://localhost:8080";

class WebSocketChatService {
    stompClient = null;
    subscriptions = new Map();

    connect(onConnected, onError) {
        const token = localStorage.getItem('authToken');
        console.log('[WebSocket] Using token:', token); // Debug log
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
        this.stompClient?.deactivate();
        this.subscriptions.clear();
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

    send(destination, payload) {
        this.stompClient?.publish({
            destination,
            body: JSON.stringify(payload)
        });
    }
}

export const webSocketService = new WebSocketChatService();
