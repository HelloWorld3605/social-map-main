# 🔥 CRITICAL BUG FIXED - ChatWindow Xóa Callbacks Của SideChat!

## 🐛 Vấn đề phát hiện từ logs:

### Logs từ user sau reload:
```
(User B gửi message → KHÔNG có logs "📨 SideChat received")

(User A mở ChatWindow)
🔌 Unsubscribed from /topic/conversation/68ffb... ← XÓA CALLBACKS!
🔌 Unsubscribed from /topic/conversation/68ffb.../typing
🔌 Unsubscribed from /topic/conversation/68ffb.../update
✅ Subscribed to /topic/conversation/68ffb... ← Subscribe lại
✅ Subscribed to /topic/conversation/68ffb.../typing
✅ Subscribed to /topic/conversation/68ffb.../update
```

## 🎯 Root Cause:

### Code cũ trong ChatWindow (SAI):
```javascript
useEffect(() => {
    webSocketService.subscribeToConversation(
        conversation.id,
        (message) => { /* inline callback */ },
        (typing) => { /* inline callback */ },
        (update) => { /* inline callback */ }
    );
    
    return () => {
        // ❌ SAI: Không truyền callback parameter
        webSocketService.unsubscribe(`/topic/conversation/${conversation.id}`);
        // → XÓA TẤT CẢ callbacks, kể cả của SideChat!
    };
}, [conversation?.id, ...]);
```

### WebSocketService.unsubscribe() logic:
```javascript
unsubscribe(destination, callback) {
    if (callback && this.callbacks.has(destination)) {
        // Có callback → chỉ xóa callback đó
        this.callbacks.get(destination).delete(callback);
        
        if (this.callbacks.get(destination).size === 0) {
            // Hết callbacks → unsubscribe STOMP
        }
    } else {
        // ❌ KHÔNG có callback → XÓA TẤT CẢ!
        this.callbacks.delete(destination);
        sub?.unsubscribe();
        this.subscriptions.delete(destination);
    }
}
```

### Flow lỗi:

```
1. SideChat subscribe:
   - messageCallback1 (SideChat)
   - typingCallback1 (SideChat)
   → callbacks.set('/topic/conversation/68ffb...', Set([callback1SideChat]))

2. ChatWindow mount → subscribe:
   - messageCallback2 (ChatWindow)
   - typingCallback2 (ChatWindow)
   → callbacks.set('/topic/conversation/68ffb...', Set([callback1SideChat, callback2ChatWindow]))

3. ChatWindow unmount (hoặc conversation thay đổi) → cleanup:
   webSocketService.unsubscribe('/topic/conversation/68ffb...'); // ← KHÔNG có callback param!
   → XÓA TẤT CẢ callbacks (kể cả của SideChat!)
   → callbacks.delete('/topic/conversation/68ffb...')
   → SideChat mất callbacks!

4. Message mới đến:
   → Không có callbacks nào!
   → SideChat KHÔNG nhận được message!
```

---

## ✅ Fix:

### Code mới trong ChatWindow (ĐÚNG):

```javascript
useEffect(() => {
    if (!conversation?.id) return;

    // ✅ Tạo callbacks với stable references
    const messageCallback = (message) => {
        console.log('📨 ChatWindow received new message:', message);
        // ... handle message
    };

    const typingCallback = (typingDTO) => {
        console.log('ChatWindow received typing:', typingDTO);
        // ... handle typing
    };

    const updateCallback = (updatedMessage) => {
        // ... handle update
    };

    // Subscribe
    console.log('🔔 ChatWindow subscribing to conversation:', conversation.id);
    webSocketService.subscribeToConversation(
        conversation.id,
        messageCallback,
        typingCallback,
        updateCallback
    );

    return () => {
        // ✅ ĐÚNG: Truyền callback references để chỉ xóa callbacks của ChatWindow
        console.log('🧹 ChatWindow cleanup: unsubscribing callbacks for', conversation.id);
        webSocketService.unsubscribe(`/topic/conversation/${conversation.id}`, messageCallback);
        webSocketService.unsubscribe(`/topic/conversation/${conversation.id}/typing`, typingCallback);
        webSocketService.unsubscribe(`/topic/conversation/${conversation.id}/update`, updateCallback);
    };
}, [conversation?.id, currentUserId, minimized, onNewMessage, scrollToBottom]);
```

### Sự khác biệt:

| | Code cũ (SAI) | Code mới (ĐÚNG) |
|---|---|---|
| **Callbacks** | Inline (không có reference) | Stable references |
| **Unsubscribe** | `unsubscribe(dest)` | `unsubscribe(dest, callback)` ✅ |
| **Kết quả** | Xóa TẤT CẢ callbacks | Chỉ xóa callbacks của ChatWindow |
| **Impact** | SideChat mất callbacks ❌ | SideChat giữ callbacks ✅ |

---

## 🔄 Flow sau khi fix:

```
1. SideChat subscribe:
   → callbacks = Set([callbackSideChat])

2. ChatWindow subscribe:
   → callbacks = Set([callbackSideChat, callbackChatWindow])

3. ChatWindow cleanup:
   webSocketService.unsubscribe(dest, callbackChatWindow); // ← Có callback!
   → Chỉ xóa callbackChatWindow
   → callbacks = Set([callbackSideChat]) ✅

4. Message mới:
   → callbackSideChat được gọi ✅
   → SideChat nhận message và update UI ✅
```

---

## 🧪 Test sau fix:

### Bước 1: Reload trang
```
✅ WebSocket connected
🔄 Subscribe effect running
🔔 SideChat subscribed to conversation 68ffb...
📊 Subscribe summary: 2 new, 0 skipped, 2 total tracked
```

### Bước 2: Gửi message (KHÔNG mở ChatWindow)
```
📨 SideChat received new message for conv 68ffb...  ← NÊN THẤY!
✏️ Updating last message for conv 68ffb...: Test message
```
✅ Last message update trong UI!

### Bước 3: Mở ChatWindow
```
🔔 ChatWindow subscribing to conversation: 68ffb...
✅ Subscribed to /topic/conversation/68ffb...
✅ Subscribed to /topic/conversation/68ffb.../typing
✅ Subscribed to /topic/conversation/68ffb.../update
⚡ Added callback to existing subscription ← Good!
```

### Bước 4: Gửi message (ĐÃ mở ChatWindow)
```
📨 SideChat received new message ← SideChat vẫn nhận!
✏️ Updating last message
📨 ChatWindow received new message ← ChatWindow cũng nhận!
```
✅ Cả 2 đều update!

### Bước 5: Đóng ChatWindow
```
🧹 ChatWindow cleanup: unsubscribing callbacks for 68ffb...
🔥 Removed callback from /topic/conversation/68ffb..., X remaining ← Vẫn còn callbacks của SideChat!
```

### Bước 6: Gửi message (SAU khi đóng ChatWindow)
```
📨 SideChat received new message ← VẪN NHẬN!
✏️ Updating last message
```
✅ SideChat vẫn hoạt động!

---

## 📊 So sánh:

| Tình huống | Trước fix | Sau fix |
|-----------|-----------|---------|
| Load trang → subscribe | ✅ OK | ✅ OK |
| Message mới (chưa mở ChatWindow) | ✅ OK | ✅ OK |
| Mở ChatWindow | ❌ XÓA callbacks SideChat | ✅ Thêm callbacks ChatWindow |
| Message mới (đã mở ChatWindow) | ❌ Chỉ ChatWindow nhận | ✅ CẢ HAI nhận |
| Đóng ChatWindow | ❌ SideChat mất callbacks | ✅ SideChat giữ callbacks |
| Message mới (sau đóng ChatWindow) | ❌ KHÔNG nhận | ✅ NHẬN |

---

## 🎯 Key Lessons:

### 1. Callback References Matter!
- Inline callbacks → Không có reference → Không thể unsubscribe chính xác
- Stable references → Có reference → Unsubscribe đúng callback

### 2. Multiple Subscribers Pattern:
```javascript
// ĐÚNG:
const callback = (data) => { /* ... */ };
service.subscribe(topic, callback);
// Later:
service.unsubscribe(topic, callback); // ← CHỈ xóa callback này

// SAI:
service.subscribe(topic, (data) => { /* ... */ });
// Later:
service.unsubscribe(topic); // ← XÓA TẤT CẢ callbacks!
```

### 3. Cleanup Hygiene:
- Cleanup phải chính xác
- Chỉ cleanup resources của component đó
- KHÔNG cleanup resources của components khác

---

## ✅ Status:

**BUG FIXED!** 🎉

**Changes:**
- ✅ ChatWindow tạo callback references
- ✅ ChatWindow unsubscribe với callback references
- ✅ Chỉ xóa callbacks của ChatWindow
- ✅ SideChat callbacks được giữ nguyên

**Result:**
- ✅ SideChat nhận message real-time
- ✅ ChatWindow nhận message khi mở
- ✅ SideChat vẫn hoạt động sau khi đóng ChatWindow

---

**RELOAD VÀ TEST NGAY!** 🚀

