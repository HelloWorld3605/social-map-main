# ✅ COMPLETED: Fix Last Message Real-time Display in SideChat

## 🎯 Vấn đề đã giải quyết

**Trước khi fix:**
- ❌ Last message trong SideChat KHÔNG hiển thị real-time khi user không mở ChatWindow
- ❌ Chỉ khi mở ChatWindow và nhắn tin thì last message mới cập nhật
- ❌ WebSocket chỉ subscribe cho ChatWindow đang mở, không subscribe cho tất cả conversations

**Sau khi fix:**
- ✅ Last message trong SideChat hiển thị real-time cho TẤT CẢ conversations
- ✅ Không cần mở ChatWindow, last message vẫn update ngay lập tức
- ✅ Cả SideChat và ChatWindow đều nhận message đồng thời (multiple callbacks)
- ✅ Location messages hiển thị "Vị trí" thay vì raw JSON

## 📝 Files đã sửa

### 1. `src/services/ChatService.js`
**Thay đổi chính:**
- Thêm `callbacks` Map để hỗ trợ multiple callbacks cho cùng destination
- Refactor `subscribe()` method để cho phép nhiều component subscribe cùng topic
- Refactor `unsubscribe()` method để cleanup đúng cách
- Thêm method `sendMarkAsRead()` để ChatWindow có thể đánh dấu đã đọc qua WebSocket

**Code changes:**
```javascript
class WebSocketChatService {
    constructor() {
        this.stompClient = null;
        this.subscriptions = new Map(); // Map<destination, subscription>
        this.callbacks = new Map(); // Map<destination, Set<callback>> ← MỚI
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
                // Call all registered callbacks for this destination ← QUAN TRỌNG
                const callbacks = this.callbacks.get(destination);
                if (callbacks) {
                    callbacks.forEach(cb => cb(data));
                }
            });
            this.subscriptions.set(destination, sub);
        }
    }

    unsubscribe(destination, callback) {
        // Remove specific callback, only unsubscribe STOMP when no callbacks left
        if (callback && this.callbacks.has(destination)) {
            this.callbacks.get(destination).delete(callback);
            
            if (this.callbacks.get(destination).size === 0) {
                this.callbacks.delete(destination);
                const sub = this.subscriptions.get(destination);
                sub?.unsubscribe();
                this.subscriptions.delete(destination);
            }
        }
    }

    sendMarkAsRead({ conversationId }) { // ← MỚI
        if (!this.stompClient?.connected) return;
        this.stompClient.publish({
            destination: '/app/markAsRead',
            body: JSON.stringify({ conversationId })
        });
    }
}
```

### 2. `src/components/Chat/SideChat.jsx`
**Thay đổi chính:**
- Subscribe vào message stream cho TẤT CẢ conversations (không chỉ typing)
- Update last message ngay lập tức khi nhận message qua WebSocket
- Track callbacks để cleanup đúng cách
- Handle location messages để hiển thị "Vị trí"

**Code changes:**
```javascript
// Thêm refs để track subscriptions và callbacks
const subscribedConversationsRef = useRef(new Set());
const messageCallbacksRef = useRef(new Map());
const typingCallbacksRef = useRef(new Map());

// Subscribe to all conversations for both messages and typing
useEffect(() => {
    if (!isConnected || conversations.length === 0) return;

    conversations.forEach(conv => {
        // Skip if already subscribed
        if (subscribedConversationsRef.current.has(conv.id)) return;

        // Message callback - UPDATE LAST MESSAGE
        const messageCallback = (message) => {
            console.log('SideChat received new message for conv', conv.id, ':', message);
            
            // Process location messages
            let lastMessageContent = message.content;
            if (message.content?.startsWith('LOCATION:') || message.isLocation) {
                lastMessageContent = 'Vị trí';
            }

            // Update conversation's last message ← QUAN TRỌNG
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

        // Typing callback
        const typingCallback = (typingDTO) => {
            window.dispatchEvent(new CustomEvent('typingStatus', {
                detail: { 
                    conversationId: conv.id, 
                    isTyping: typingDTO.typing, 
                    userId: typingDTO.userId 
                }
            }));
        };

        // Save callbacks for cleanup
        messageCallbacksRef.current.set(conv.id, messageCallback);
        typingCallbacksRef.current.set(conv.id, typingCallback);

        // Subscribe ← QUAN TRỌNG
        webSocketService.subscribeToConversation(
            conv.id,
            messageCallback,  // ← Subscribe vào messages
            typingCallback,
            null
        );
        
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

## 🔄 Flow hoạt động

### Khi load website:
```
1. User login → WebSocket connect
2. Load conversations từ backend → setState conversations
3. useEffect trigger → Subscribe vào TẤT CẢ conversations
4. Mỗi conversation có 2 subscriptions:
   - /topic/conversation/{id} → message callback
   - /topic/conversation/{id}/typing → typing callback
```

### Khi nhận message mới (KHÔNG mở ChatWindow):
```
1. User B gửi message
2. Backend broadcast → /topic/conversation/{convId}
3. WebSocket nhận message
4. Gọi TẤT CẢ callbacks đã register:
   - SideChat callback → Update last message ✅
5. UI update ngay lập tức trong SideChat
```

### Khi nhận message mới (ĐÃ mở ChatWindow):
```
1. User B gửi message
2. Backend broadcast → /topic/conversation/{convId}
3. WebSocket nhận message
4. Gọi TẤT CẢ callbacks (2 callbacks):
   - SideChat callback → Update last message ✅
   - ChatWindow callback → Hiển thị message trong chat ✅
5. Cả 2 UIs đều update đồng thời
```

## ✨ Tính năng mới

### Multiple Callbacks Support
- Nhiều components có thể subscribe cùng 1 WebSocket topic
- Mỗi component có callback riêng
- Tất cả callbacks đều được gọi khi có message mới
- Cleanup tự động khi component unmount

### Smart Subscription Management
- Chỉ subscribe STOMP 1 lần cho mỗi topic
- Thêm callbacks vào Set mà không tạo duplicate subscription
- Chỉ unsubscribe STOMP khi không còn callback nào
- Tránh memory leak và duplicate subscriptions

### Location Message Handling
- Detect location message: `content.startsWith('LOCATION:')` hoặc `isLocation: true`
- Hiển thị "Vị trí" thay vì raw JSON trong last message
- Consistent display trong cả SideChat và ChatWindow

## 🧪 Cách test

### Test 1: Load website lần đầu
```
1. Clear cache & reload
2. Login
3. Check console: "✅ Subscribed to /topic/conversation/..." cho mỗi conversation
4. Last message của tất cả conversations hiển thị đúng
```

### Test 2: Nhận message khi KHÔNG mở ChatWindow
```
1. Đăng nhập 2 tài khoản (2 browsers)
2. User A: KHÔNG mở ChatWindow nào
3. User B: Gửi message cho User A
4. User A: Check last message update real-time ✅
5. Console log: "SideChat received new message for conv..."
```

### Test 3: Nhận message khi ĐÃ mở ChatWindow
```
1. User A: Mở ChatWindow với User B
2. User B: Gửi message
3. User A: 
   - Message hiển thị trong ChatWindow ✅
   - Last message trong SideChat cũng update ✅
4. Console log 2 dòng:
   - "SideChat received new message..."
   - "ChatWindow received new message..."
```

### Test 4: Location message
```
1. User B: Gửi location message
2. User A: Last message hiển thị "Vị trí" ✅
3. Không phải raw JSON
```

## 📊 So sánh trước/sau

| Tính năng | Trước | Sau |
|-----------|-------|-----|
| Last message real-time (không mở chat) | ❌ | ✅ |
| Last message real-time (đã mở chat) | ✅ | ✅ |
| Multiple callbacks support | ❌ | ✅ |
| Location message display | Raw JSON | "Vị trí" |
| Memory leak prevention | ⚠️ | ✅ |
| Console debugging | Limited | Full logs |

## 🐛 Known Issues & Solutions

### Issue: Last message vẫn không update
**Giải pháp:**
1. Check WebSocket connection: `webSocketService.stompClient?.connected`
2. Check subscriptions: `webSocketService.subscriptions.size`
3. Check backend có broadcast đúng topic không

### Issue: Duplicate messages
**Giải pháp:**
- Đã handle bằng `subscribedConversationsRef` để tránh subscribe duplicate
- Cleanup đúng cách trong useEffect return function

### Issue: Memory leak
**Giải pháp:**
- Cleanup callbacks khi component unmount
- Unsubscribe với đúng callback reference
- Clear tất cả refs khi disconnect

## 📚 Documentation created
1. `CHAT_FIX_SUMMARY.md` - Tổng quan về fix
2. `CHAT_DEBUG_GUIDE.md` - Hướng dẫn debug và test chi tiết
3. `IMPLEMENTATION_COMPLETE.md` - File này (tổng kết)

## ✅ Checklist hoàn thành
- [x] Refactor WebSocketService để hỗ trợ multiple callbacks
- [x] Update SideChat để subscribe vào messages
- [x] Thêm tracking refs để quản lý subscriptions
- [x] Handle location messages
- [x] Add proper cleanup
- [x] Add sendMarkAsRead method
- [x] Test và verify không có compile errors
- [x] Tạo documentation

## 🚀 Next Steps
1. Test trên môi trường thực
2. Monitor console logs để verify
3. Fix backend nếu cần (broadcast topics)
4. Performance optimization nếu có nhiều conversations (lazy subscribe)

---
**Status:** ✅ COMPLETED AND READY FOR TESTING
**Date:** November 1, 2025

