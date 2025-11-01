# 🔍 DEBUG LOGS - Enhanced Version

## ✅ Đã thêm logs chi tiết để debug

### Logs mới được thêm vào:

#### 1. Loading conversations:
```
🔄 Loading conversations on mount
```

#### 2. Effect 2 trigger (QUAN TRỌNG):
```
🔄 Effect 2 triggered: {isConnected: true/false, conversationsLength: X, trackedIds: [...]}
```

**Các trường hợp:**

##### Case A: Waiting for connection
```
🔄 Effect 2 triggered: {isConnected: false, conversationsLength: X, trackedIds: [...]}
⏸️ Waiting for connection...
```

##### Case B: Waiting for conversations
```
🔄 Effect 2 triggered: {isConnected: true, conversationsLength: 0, trackedIds: [...]}
⏸️ No conversations yet, waiting...
```

##### Case C: Ready to subscribe
```
🔄 Effect 2 triggered: {isConnected: true, conversationsLength: 2, trackedIds: []}
✅ Ready to subscribe! Processing conversations...
⏭️ Skipping conv1 (already subscribed) [hoặc]
🆕 New conversation detected: conv1, will subscribe
🔔 SideChat subscribed to conversation conv1
📊 Subscribe summary: 2 new, 0 skipped, 2 total tracked
```

---

## 🧪 Hướng dẫn test với logs mới:

### Test sau reload:

#### Bước 1: Mở Console (F12) và Clear

#### Bước 2: RELOAD trang (F5)

#### Bước 3: Kiểm tra logs theo thứ tự:

##### ✅ Logs NÊN có (đúng):
```
1. 🔄 Loading conversations on mount
2. 🔄 Subscribe effect running (on connection change): {isConnected: false, trackedIds: []}
3. ✅ WebSocket connected
4. 🔄 Subscribe effect running (on connection change): {isConnected: true, trackedIds: []}
5. 🔄 Effect 2 triggered: {isConnected: true, conversationsLength: 0, trackedIds: []}
6. ⏸️ No conversations yet, waiting...
7. (Conversations load xong)
8. 🔄 Effect 2 triggered: {isConnected: true, conversationsLength: 2, trackedIds: []}
9. ✅ Ready to subscribe! Processing conversations...
10. 🆕 New conversation detected: CONV_ID_1, will subscribe
11. 🔔 SideChat subscribed to conversation CONV_ID_1
12. 🆕 New conversation detected: CONV_ID_2, will subscribe
13. 🔔 SideChat subscribed to conversation CONV_ID_2
14. 📊 Subscribe summary: 2 new, 0 skipped, 2 total tracked
```

##### ❌ Logs KHÔNG nên có (sai):
```
🔄 Effect 2 triggered: {isConnected: true, conversationsLength: 2, trackedIds: ['conv1', 'conv2']}
⏭️ Skipping conv1 (already subscribed)
⏭️ Skipping conv2 (already subscribed)
📊 Subscribe summary: 0 new, 2 skipped, 2 total tracked
```
→ Nếu thấy: Ref CHƯA được clear! Bug!

---

## 🔍 Scenarios để debug:

### Scenario 1: Ref không được clear sau reload

**Logs:**
```
🧹 Cleaning up all subscriptions due to unmount/disconnect
(Reload)
🔄 Effect 2 triggered: {trackedIds: ['conv1', 'conv2']} ← Vẫn còn data!
⏭️ Skipping conv1 (already subscribed)
📊 Subscribe summary: 0 new, 2 skipped
```

**Vấn đề:** Cleanup không chạy hoặc ref không được clear

**Kiểm tra:**
- Có thấy "🧹 Cleaning up" TRƯỚC khi reload không?
- Nếu không → cleanup không chạy

### Scenario 2: Effect 2 không chạy sau khi conversations load

**Logs:**
```
🔄 Loading conversations on mount
🔄 Effect 2 triggered: {conversationsLength: 0, trackedIds: []}
⏸️ No conversations yet, waiting...
(Sau đó KHÔNG có log Effect 2 nữa)
```

**Vấn đề:** Effect 2 không chạy lại sau khi conversations được set

**Nguyên nhân có thể:**
- Dependency `[conversations, isConnected]` không trigger re-run
- Hoặc conversations object reference không thay đổi

**Kiểm tra:**
```javascript
// Thêm log vào loadConversations:
console.log('📥 Conversations loaded:', processedData.length, 'conversations');
setConversations(processedData);
console.log('✅ State updated');
```

### Scenario 3: WebSocket chưa connect khi conversations load

**Logs:**
```
🔄 Loading conversations on mount
🔄 Effect 2 triggered: {isConnected: false, conversationsLength: 2, trackedIds: []}
⏸️ Waiting for connection...
(Sau đó)
✅ WebSocket connected
🔄 Effect 2 triggered: {isConnected: true, conversationsLength: 2, trackedIds: []}
✅ Ready to subscribe!
...
```

**Kết quả:** ✅ OK - Effect 2 chạy lại khi isConnected thay đổi

---

## 🎯 Checklist Debug:

Sau khi reload, check các điều sau:

### 1. ✅ Cleanup chạy
```
🧹 Cleaning up all subscriptions due to unmount/disconnect
```
Nếu KHÔNG thấy → Component không unmount đúng cách

### 2. ✅ Ref được clear
```
🔄 Effect 2 triggered: {trackedIds: []} ← EMPTY ARRAY!
```
Nếu có data → Cleanup không clear ref

### 3. ✅ Conversations được load
```
🔄 Effect 2 triggered: {conversationsLength: X} ← X > 0
```
Nếu = 0 → Conversations chưa load hoặc load fail

### 4. ✅ WebSocket connected
```
🔄 Effect 2 triggered: {isConnected: true}
```
Nếu false → WebSocket chưa connect

### 5. ✅ Subscribe thành công
```
🆕 New conversation detected: ...
🔔 SideChat subscribed to conversation ...
📊 Subscribe summary: X new, 0 skipped
```
Nếu "0 new, X skipped" → Không subscribe → BUG!

### 6. ✅ Nhận message
```
📨 SideChat received new message for conv ...
✏️ Updating last message for conv ...
```

---

## 🚨 Nếu vẫn không hoạt động:

### Paste FULL logs theo format:

```
=== BEFORE RELOAD ===
(Copy tất cả logs trước khi reload)

=== RELOAD (F5) ===

=== AFTER RELOAD ===
(Copy tất cả logs sau reload)

=== SEND MESSAGE TEST ===
(Copy logs khi gửi message test)

=== UI STATUS ===
Last message có update không? YES/NO
```

Với logs chi tiết này, tôi sẽ xác định chính xác vấn đề ở đâu!

---

## 🔧 Quick Fix Commands (nếu cần):

### Force clear ref manually (trong console):
```javascript
// Không thể access trực tiếp, nhưng có thể force reload:
window.location.reload(true); // Hard reload
```

### Check WebSocket status:
```javascript
console.log('WS Connected:', webSocketService?.stompClient?.connected);
console.log('Subscriptions:', webSocketService?.subscriptions?.size);
console.log('Callbacks:', 
    Array.from(webSocketService?.callbacks?.entries() || [])
        .map(([k, v]) => `${k}: ${v.size}`)
);
```

---

**RELOAD VÀ CHECK LOGS NGAY!** 📊

