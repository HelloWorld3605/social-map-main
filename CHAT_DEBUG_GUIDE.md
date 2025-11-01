# Chat Debug Guide - Last Message Real-time Fix

## Cách test fix

### 1. Mở Browser Console
Mở DevTools (F12) → Console tab để xem logs

### 2. Load website
Quan sát các logs sau:
```
✅ WebSocket connected
✅ Current user ID from JWT: [userId]
✅ Subscribed to /user/queue/unread
✅ Subscribed to /user/queue/conversation-update
```

### 3. Sau khi load conversations
Sẽ thấy logs subscribe cho mỗi conversation:
```
✅ Subscribed to /topic/conversation/[convId]
✅ Subscribed to /topic/conversation/[convId]/typing
```

### 4. Khi có message mới (KHÔNG mở ChatWindow)
Sẽ thấy:
```
SideChat received new message for conv [convId] : {message object}
```

→ **Last message trong SideChat phải update ngay lập tức**

### 5. Khi mở ChatWindow
Sẽ thấy:
```
⚡ Added callback to existing subscription: /topic/conversation/[convId]
⚡ Added callback to existing subscription: /topic/conversation/[convId]/typing
```

→ **Có nghĩa là ChatWindow đang share subscription với SideChat**

### 6. Khi có message mới (ĐÃ mở ChatWindow)
Sẽ thấy 2 logs (do 2 callbacks):
```
SideChat received new message for conv [convId] : {message object}
ChatWindow received new message : {message object}
```

→ **Cả SideChat và ChatWindow đều nhận message và update UI**

## Các trường hợp test

### Test Case 1: Load website lần đầu
**Steps:**
1. Clear cache & reload
2. Login
3. Vào trang có chat

**Expected:**
- Last message của tất cả conversations hiển thị đúng (từ backend)
- WebSocket connect thành công
- Subscribe vào tất cả conversations

### Test Case 2: Nhận message mới khi KHÔNG mở ChatWindow
**Steps:**
1. Đăng nhập 2 tài khoản khác nhau (2 browser/incognito)
2. User A: Không mở ChatWindow nào
3. User B: Gửi message cho User A

**Expected:**
- User A thấy last message update ngay lập tức trong SideChat
- Unread count tăng lên
- Console log: "SideChat received new message for conv..."

### Test Case 3: Nhận message khi ĐÃ mở ChatWindow
**Steps:**
1. User A: Mở ChatWindow với User B
2. User B: Gửi message

**Expected:**
- Message hiển thị trong ChatWindow của User A
- Last message trong SideChat cũng update
- Console log cả 2: SideChat và ChatWindow received message

### Test Case 4: Location message
**Steps:**
1. User B gửi location message
2. User A không mở ChatWindow

**Expected:**
- Last message hiển thị "Vị trí" (không phải raw JSON)
- Console log: lastMessageContent = "Vị trí"

### Test Case 5: Multiple conversations
**Steps:**
1. User A có nhiều conversations
2. Các User khác nhau gửi message cho User A

**Expected:**
- Tất cả last messages đều update đúng
- Không bị override lẫn nhau
- Mỗi conversation có riêng callbacks

### Test Case 6: Open/Close ChatWindow nhiều lần
**Steps:**
1. Mở ChatWindow
2. Đóng ChatWindow
3. Mở lại
4. Nhận message

**Expected:**
- Không bị duplicate subscription
- Message vẫn nhận đúng
- Console log: "Added callback to existing subscription" (lần mở thứ 2 trở đi)

## Troubleshooting

### Vấn đề: Last message không update
**Check:**
1. WebSocket có connected không? → Check console log "✅ WebSocket connected"
2. Có subscribe vào conversation không? → Check "✅ Subscribed to /topic/conversation/[id]"
3. Message có được gửi qua WebSocket không? → Check backend logs
4. Callback có được gọi không? → Check "SideChat received new message"

**Solutions:**
- Nếu không connect: Check authToken trong localStorage
- Nếu không subscribe: Check conversations.length > 0
- Nếu callback không được gọi: Check backend có broadcast đúng topic không

### Vấn đề: ChatWindow không nhận message
**Check:**
1. Console log có "Added callback to existing subscription" không?
2. Có 2 logs khi nhận message không? (SideChat + ChatWindow)

**Solutions:**
- Clear refs và reload: `subscribedConversationsRef.current.clear()`
- Check cleanup trong useEffect có chạy đúng không

### Vấn đề: Memory leak / Multiple subscriptions
**Check:**
1. Số lượng subscriptions: `webSocketService.subscriptions.size`
2. Số lượng callbacks: `webSocketService.callbacks.get('/topic/conversation/[id]').size`

**Solutions:**
- Đảm bảo cleanup chạy khi unmount
- Check unsubscribe có truyền đúng callback reference không

## Backend Requirements

Backend cần broadcast message lên các topics sau:

### 1. New message
```
Topic: /topic/conversation/{conversationId}
Payload: {
  id: string,
  conversationId: string,
  senderId: string,
  senderName: string,
  content: string,  // hoặc "LOCATION:{...}" cho location
  timestamp: ISO date string,
  messageType: "TEXT" | "IMAGE" | "LOCATION"
}
```

### 2. Unread count
```
Topic: /user/queue/unread
Payload: {
  conversationId: string,
  count: number
}
```

### 3. Conversation update (optional - fallback)
```
Topic: /user/queue/conversation-update
Payload: {
  conversationId: string,
  lastMessageContent: string,
  lastMessageSenderId: string,
  lastMessageAt: ISO date string,
  unreadCount: number
}
```

## Console Commands for Debugging

```javascript
// Check WebSocket connection
webSocketService.stompClient?.connected

// Check current subscriptions
webSocketService.subscriptions

// Check callbacks for a conversation
webSocketService.callbacks.get('/topic/conversation/CONV_ID')

// Check all subscribed conversations in SideChat
// (Paste this in console when on the page)
window.sideChatSubscriptions = subscribedConversationsRef.current

// Manually trigger a test message (in console)
// webSocketService.sendChatMessage({
//   conversationId: 'CONV_ID',
//   content: 'Test message',
//   messageType: 'TEXT'
// })
```

