import { useEffect } from "react";
import { webSocketService } from "../services/WebSocketChatService";

/**
 * Hook realtime status chỉ để SUBSCRIBE, không mở kết nối mới
 */
export default function useRealtimeStatus(onStatusChange) {
  useEffect(() => {
    // ✅ Nếu WebSocket chưa kết nối, không subscribe vội
    if (!webSocketService.stompClient || !webSocketService.stompClient.connected) {
      console.warn("[RealtimeStatus] WebSocket chưa sẵn sàng, đợi sự kiện 'websocket-connected'");
      const handleConnected = () => {
        console.log("[RealtimeStatus] Bắt đầu subscribe /topic/status");
        webSocketService.subscribe("/topic/status", (data) => {
          try {
            onStatusChange(data.userId, data.status);
          } catch (err) {
            console.error("❌ Parse lỗi realtime status:", err);
          }
        });
      };

      // Khi websocket connect xong thì subscribe
      window.addEventListener("websocket-connected", handleConnected);

      // Cleanup event listener
      return () => {
        window.removeEventListener("websocket-connected", handleConnected);
        webSocketService.unsubscribeAll("/topic/status");
      };
    }

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
