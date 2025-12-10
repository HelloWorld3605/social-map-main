import { useEffect } from "react";
import { webSocketService } from "../services/WebSocketChatService";

/**
 * Hook realtime status chỉ để SUBSCRIBE, không mở kết nối mới
 * 🆕 Cải thiện với retry pattern
 */
export default function useRealtimeStatus(onStatusChange) {
  useEffect(() => {
    let isSubscribed = false;
    let retryInterval = null;
    let retryCount = 0;
    const maxRetries = 10;
    const retryDelay = 500;

    const subscribeNow = () => {
      if (isSubscribed) return;

      console.log("[RealtimeStatus] Subscribing /topic/status");
      webSocketService.subscribe("/topic/status", (data) => {
        try {
          onStatusChange(data.userId, data.status);
        } catch (err) {
          console.error("❌ Parse lỗi realtime status:", err);
        }
      });
      isSubscribed = true;
    };

    const trySubscribe = () => {
      if (isSubscribed) return;

      if (webSocketService.stompClient?.connected) {
        console.log(`[RealtimeStatus] ✅ WebSocket connected (attempt ${retryCount}), subscribing`);
        subscribeNow();
        if (retryInterval) {
          clearInterval(retryInterval);
          retryInterval = null;
        }
      } else {
        retryCount++;
        if (retryCount >= maxRetries) {
          console.warn(`[RealtimeStatus] ⚠️ WebSocket chưa connected sau ${maxRetries} lần retry. Chờ event...`);
          if (retryInterval) {
            clearInterval(retryInterval);
            retryInterval = null;
          }
        }
      }
    };

    // Check ngay lập tức
    if (webSocketService.stompClient?.connected) {
      console.log("[RealtimeStatus] ✅ WebSocket already connected, subscribing");
      subscribeNow();
    } else {
      console.log("[RealtimeStatus] ⏸️ Chờ WebSocket connected...");
      retryInterval = setInterval(trySubscribe, retryDelay);
    }

    // Lắng nghe event websocket-connected
    const handleConnected = () => {
      if (isSubscribed) return;
      console.log("[RealtimeStatus] 🎉 Received websocket-connected event");
      subscribeNow();
      if (retryInterval) {
        clearInterval(retryInterval);
        retryInterval = null;
      }
    };

    window.addEventListener("websocket-connected", handleConnected);

    // Cleanup khi component unmount
    return () => {
      if (retryInterval) clearInterval(retryInterval);
      window.removeEventListener("websocket-connected", handleConnected);
      webSocketService.unsubscribeAll("/topic/status");
      console.log("[RealtimeStatus] Unsubscribed /topic/status");
    };
  }, [onStatusChange]);
}
