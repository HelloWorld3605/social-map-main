import { useEffect } from "react";
import { webSocketService } from "../services/WebSocketChatService";

/**
 * Hook realtime status chỉ để SUBSCRIBE, không mở kết nối mới
 */
export default function useRealtimeStatus(onStatusChange) {
  useEffect(() => {
    // ✅ Nếu WebSocket chưa kết nối, không subscribe vội
    if (!webSocketService.stompClient) {
      console.warn("[RealtimeStatus] Chưa có stompClient, đợi sự kiện 'websocket-connected'");
      const handleConnected = () => subscribeNow();
      window.addEventListener("websocket-connected", handleConnected);
      return () => window.removeEventListener("websocket-connected", handleConnected);
    }

// 👉 Nếu đã có stompClient, thì SUBSCRIBE NGAY dù connected hay chưa
    const subscribeNow = () => {
      console.log("[RealtimeStatus] Subscribing /topic/status");
      webSocketService.subscribe("/topic/status", (data) => {
        try {
          onStatusChange(data.userId, data.status);
        } catch (err) {
          console.error("❌ Parse lỗi realtime status:", err);
        }
      });
    };

// Nếu WebSocket đã kết nối thì chạy ngay
    if (webSocketService.stompClient.connected) {
      subscribeNow();
    } else {
      // Nếu chưa connect, đợi event từ App.jsx
      const handleConnected = () => {
        subscribeNow();
        window.removeEventListener("websocket-connected", handleConnected);
      };
      window.addEventListener("websocket-connected", handleConnected);
    }

// Cleanup
    return () => {
      webSocketService.unsubscribeAll("/topic/status");
      console.log("[RealtimeStatus] Unsubscribed /topic/status");
    };

    // Nếu đã kết nối thì subscribe ngay
    console.log("[RealtimeStatus] Subscribe trực tiếp /topic/status");
    webSocketService.subscribe("/topic/status", (data) => {
      try {
        onStatusChange(data.userId, data.status);
      } catch (err) {
        console.error("❌ Parse lỗi realtime status:", err);
      }
    });

    // Cleanup khi component unmount
    return () => {
      webSocketService.unsubscribeAll("/topic/status");
      console.log("[RealtimeStatus] Unsubscribed /topic/status");
    };
  }, [onStatusChange]);
}
