# Chat Last Message Fix Summary

## Vấn đề
- Last message trong SideChat không hiển thị đúng và real-time khi user không mở ChatWindow
- Chỉ khi mở ChatWindow và nhắn tin thì last message mới cập nhật

## Nguyên nhân
1. **SideChat không subscribe vào message stream của tất cả conversations**
   - Trước đây chỉ subscribe vào typing status
   - Không nhận được message mới qua WebSocket

2. **WebSocketService không hỗ trợ multiple callbacks**
   - Khi cả SideChat và ChatWindow cùng subscribe vào 1 topic
   - Callback thứ 2 ghi đè callback thứ 1
   - Dẫn đến chỉ component subscribe sau nhận được message

## Giải pháp đã implement

### 1. Refactor WebSocketService để hỗ trợ multiple callbacks
**File: `src/services/ChatService.js`**
- Thêm `callbacks` Map để lưu tất cả callbacks cho mỗi destination
- Khi subscribe: thêm callback vào Set, chỉ subscribe STOMP 1 lần
- Khi có message: gọi TẤT CẢ callbacks đã register
- Khi unsubscribe: remove callback cụ thể, chỉ unsubscribe STOMP khi không còn callback nào

```javascript
class WebSocketChatService {
    constructor() {
        this.stompClient = null;
        this.subscriptions = new Map(); // Map<destination, subscription>
        this.callbacks = new Map(); // Map<destination, Set<callback>>
        this.currentUserId = null;
    }

    subscribe(destination, callback) {
        // Add callback to callbacks set
        if (!this.callbacks.has(destination)) {
            this.callbacks.set(destination, new Set());
        }
        this.callbacks.get(destination).add(callback);

        // Only subscribe to STOMP if not already subscribed
        if (!this.subscriptions.has(destination)) {
            const sub = this.stompClient.subscribe(destination, msg => {
                const data = JSON.parse(msg.body);
                // Call all registered callbacks for this destination
                const callbacks = this.callbacks.get(destination);
                if (callbacks) {
                    callbacks.forEach(cb => cb(data));
                }
            });
            this.subscriptions.set(destination, sub);
        }
    }

    unsubscribe(destination, callback) {
        // If callback provided, remove only that callback
        if (callback && this.callbacks.has(destination)) {
            this.callbacks.get(destination).delete(callback);
            
            // If no more callbacks, unsubscribe from STOMP
            if (this.callbacks.get(destination).size === 0) {
                this.callbacks.delete(destination);
                const sub = this.subscriptions.get(destination);
                sub?.unsubscribe();
                this.subscriptions.delete(destination);
            }
        } else {
            // Remove all callbacks and unsubscribe
            this.callbacks.delete(destination);
            const sub = this.subscriptions.get(destination);
            sub?.unsubscribe();
            this.subscriptions.delete(destination);
        }
    }
}
```

### 2. Update SideChat để subscribe vào messages
**File: `src/components/Chat/SideChat.jsx`**

**Thay đổi chính:**
- Subscribe vào message stream cho TẤT CẢ conversations
- Khi nhận message mới → cập nhật last message ngay lập tức
- Track subscribed conversations để tránh duplicate
- Lưu callback references để cleanup đúng cách

```javascript
// Subscribe to all conversations for both messages and typing
useEffect(() => {
    if (!isConnected || conversations.length === 0) return;

    conversations.forEach(conv => {
        // Skip if already subscribed
        if (subscribedConversationsRef.current.has(conv.id)) {
            return;
        }

        // Create message callback
        const messageCallback = (message) => {
            console.log('SideChat received new message for conv', conv.id, ':', message);
            
            // Process location messages
            let lastMessageContent = message.content;
            if (message.content && message.content.startsWith('LOCATION:')) {
                lastMessageContent = 'Vị trí';
            } else if (message.isLocation) {
                lastMessageContent = 'Vị trí';
            }

            // Update conversation's last message
            setConversations(prev => prev.map(c => {
                if (c.id === conv.id) {
                    return {
                        ...c,
                        lastMessageContent: lastMessageContent,
                        lastMessageSenderId: message.senderId,
                        lastMessageAt: message.timestamp || new Date().toISOString(),
                    };
                }
                return c;
            }));
        };

        // Create typing callback
        const typingCallback = (typingDTO) => {
            window.dispatchEvent(new CustomEvent('typingStatus', {
                detail: { conversationId: conv.id, isTyping: typingDTO.typing, userId: typingDTO.userId }
            }));
        };

        // Save callbacks for cleanup
        messageCallbacksRef.current.set(conv.id, messageCallback);
        typingCallbacksRef.current.set(conv.id, typingCallback);

        // Subscribe to messages AND typing for this conversation
        webSocketService.subscribeToConversation(
            conv.id,
            messageCallback,
            typingCallback,
            null
        );
        
        // Mark as subscribed
        subscribedConversationsRef.current.add(conv.id);
    });

    // Cleanup
    return () => {
        conversations.forEach(conv => {
            if (subscribedConversationsRef.current.has(conv.id)) {
                const messageCallback = messageCallbacksRef.current.get(conv.id);
                const typingCallback = typingCallbacksRef.current.get(conv.id);
                
                webSocketService.unsubscribe(`/topic/conversation/${conv.id}`, messageCallback);
                webSocketService.unsubscribe(`/topic/conversation/${conv.id}/typing`, typingCallback);
                
                subscribedConversationsRef.current.delete(conv.id);
                messageCallbacksRef.current.delete(conv.id);
                typingCallbacksRef.current.delete(conv.id);
            }
        });
    };
}, [conversations, isConnected]);
```

### 3. Thêm method sendMarkAsRead
**File: `src/services/ChatService.js`**

```javascript
sendMarkAsRead({ conversationId }) {
    if (!this.stompClient?.connected) {
        console.error('STOMP client not connected, cannot send mark as read');
        return;
    }
    try {
        this.stompClient.publish({
            destination: '/app/markAsRead',
            body: JSON.stringify({
                conversationId
            })
        });
        console.log('Mark as read sent for conversation:', conversationId);
    } catch (error) {
        console.error('Failed to send mark as read:', error);
    }
}
```

## Cách hoạt động mới

### Khi load website lần đầu:
1. **SideChat connect WebSocket** → load conversations
2. **Subscribe vào ALL conversations** (messages + typing)
3. **Mỗi khi có message mới** → callback được gọi → update last message

### Khi mở ChatWindow:
1. **ChatWindow cũng subscribe** vào conversation
2. **WebSocketService cho phép multiple callbacks** 
3. Cả SideChat và ChatWindow **đều nhận message**
4. SideChat → update last message
5. ChatWindow → hiển thị message trong chat

### Flow hoàn chỉnh:
```
User A gửi message
    ↓
Backend broadcast → /topic/conversation/{id}
    ↓
WebSocketService nhận message
    ↓
Gọi TẤT CẢ callbacks đã register:
    - SideChat callback → update last message
    - ChatWindow callback (nếu mở) → hiển thị message
```

## Test checklist
- [ ] Load website → last message hiển thị đúng từ backend
- [ ] Không mở ChatWindow → nhận message mới → last message update real-time
- [ ] Mở ChatWindow → nhận message → cả ChatWindow và SideChat đều update
- [ ] Location message hiển thị "Vị trí" trong last message
- [ ] Typing indicator hoạt động đúng
- [ ] Unread count update đúng

## Notes
- SideChat giờ subscribe vào messages nhưng KHÔNG tăng unread count (backend handle qua `/user/queue/unread`)
- ChatWindow vẫn hoạt động bình thường với multiple callbacks
- Memory leak đã được xử lý với proper cleanup trong useEffect

