import { useEffect, useCallback } from 'react';
import { webSocketService } from '../services/WebSocketChatService';

export default function useHeartbeat() {
    const sendHeartbeat = useCallback(() => {
        if (webSocketService.isConnected()) {
            webSocketService.send('/app/user/heartbeat', {
                timestamp: Date.now()
            });
        }
    }, []);

    useEffect(() => {
        // Send heartbeat every 30 seconds
        const interval = setInterval(() => {
            sendHeartbeat();
        }, 30000);

        // Send heartbeat on user actions
        const handleUserAction = () => {
            sendHeartbeat();
        };

        // Listen for user actions
        window.addEventListener('click', handleUserAction);
        window.addEventListener('keydown', handleUserAction);
        window.addEventListener('scroll', handleUserAction);

        // Send initial heartbeat when component mounts
        sendHeartbeat();

        return () => {
            clearInterval(interval);
            window.removeEventListener('click', handleUserAction);
            window.removeEventListener('keydown', handleUserAction);
            window.removeEventListener('scroll', handleUserAction);
        };
    }, [sendHeartbeat]);
}
