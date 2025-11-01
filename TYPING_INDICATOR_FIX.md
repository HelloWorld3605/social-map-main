# 🎯 TYPING INDICATOR FIX - Test Guide

## ✅ Đã sửa và thêm logs để debug typing indicator

### 🔧 Thay đổi:

#### 1. **SideChat typing callback**
- Bây giờ update `typingUsers` state TRỰC TIẾP
- Không còn phụ thuộc vào window event
- Logs chi tiết: `🎯`, `✍️`, `⏹️`, `📝`

#### 2. **ChatWindow typing callback**
- Thêm logs chi tiết
- Check currentUserId để tránh hiển thị typing của chính mình
- Logs: `🎯`, `✍️`, `⏹️`, `⏭️`, `📡`

#### 3. **sendTypingIndicator**
- Logs khi gửi typing status
- Check WebSocket connection
- Logs: `⌨️`, `✅`

---

## 🧪 TEST NGAY:

### Setup: 2 browsers/tabs
- **Tab 1:** User A
- **Tab 2:** User B

### Test Case 1: Typing trong ChatWindow

#### Bước 1: User A mở ChatWindow với User B

#### Bước 2: User A bắt đầu gõ tin nhắn

#### Bước 3: Check Console của User A:
```
⌨️ sendTypingIndicator called: {isTyping: true, conversationId: XXX, wsConnected: true}
✅ Typing status sent to backend
```

#### Bước 4: Check Console của User B (ChatWindow):
```
🎯 ChatWindow received typing from WebSocket: {typing: true, userId: userA_ID}
✍️ Added user userA_ID (User A Name) to typingUsers: [{userId: ..., avatar: ..., name: ...}]
📡 ChatWindow dispatching typingStatus event
```

#### Bước 5: Check UI User B:
✅ **Typing indicator NÊN hiển thị** trong ChatWindow (3 chấm nhảy)

#### Bước 6: Check Console của User B (SideChat):
```
🎯 SideChat received typing from WebSocket: {typing: true, userId: userA_ID}
✍️ User userA_ID started typing in conv XXX
📝 Updated typingUsers for conv XXX: [userA_ID]
```

#### Bước 7: Check UI User B:
✅ **"đang nhập"** NÊN hiển thị trong SideChat

#### Bước 8: User A xóa hết text (hoặc gửi message)
```
User A console:
⌨️ sendTypingIndicator called: {isTyping: false, conversationId: XXX}
✅ Typing status sent to backend

User B console (ChatWindow):
🎯 ChatWindow received typing: {typing: false, userId: userA_ID}
⏹️ Removed user userA_ID from typingUsers. Before: 1 After: 0

User B console (SideChat):
🎯 SideChat received typing: {typing: false, userId: userA_ID}
⏹️ User userA_ID stopped typing in conv XXX
📝 Updated typingUsers for conv XXX: []
```

✅ Typing indicator biến mất

---

### Test Case 2: Typing khi chưa mở ChatWindow

#### Bước 1: User A và User B đều KHÔNG mở ChatWindow

#### Bước 2: User A mở ChatWindow, bắt đầu gõ

#### Bước 3: Check User B console:
```
🎯 SideChat received typing: {typing: true, userId: userA_ID}
✍️ User userA_ID started typing in conv XXX
📝 Updated typingUsers for conv XXX: [userA_ID]
```

#### Bước 4: Check UI User B:
✅ **"đang nhập"** hiển thị trong SideChat conversation item

---

## 🚨 Troubleshooting:

### Vấn đề 1: Không thấy logs "🎯 received typing"

**Nguyên nhân:** Backend không broadcast typing hoặc subscription không đúng

**Check:**
1. Backend logs có broadcast typing không?
2. WebSocket subscription đúng topic `/topic/conversation/{id}/typing`?

**Test manual:**
```javascript
// Trong console:
webSocketService.subscriptions.has('/topic/conversation/XXX/typing')
// Should be: true
```

### Vấn đề 2: Thấy logs nhưng UI không update

**Nguyên nhân:** State không update hoặc component không re-render

**Check:**
1. Có logs "📝 Updated typingUsers" không?
2. typingUsers array có data không?
3. Component có re-render không?

### Vấn đề 3: Typing của chính mình hiển thị

**Nguyên nhân:** currentUserId không khớp

**Check logs:**
```
⏭️ Skipping typing from self (currentUser)
```

Nếu KHÔNG thấy → currentUserId sai!

**Fix:**
```javascript
console.log('Current user ID:', currentUserId);
console.log('Typing user ID:', typingDTO.userId);
```

### Vấn đề 4: Typing không tắt sau khi gửi message

**Nguyên nhân:** sendTypingIndicator(false) không được gọi

**Check:**
```javascript
// Trong handleSend, NÊN có:
sendTypingIndicator(false);
```

---

## 📊 Expected Logs Flow:

### User A gõ tin nhắn:
```
USER A:
⌨️ sendTypingIndicator called: {isTyping: true}
✅ Typing status sent to backend

USER B (ChatWindow nếu mở):
🎯 ChatWindow received typing: {typing: true, userId: A}
✍️ Added user A to typingUsers
📡 ChatWindow dispatching typingStatus event

USER B (SideChat):
🎯 SideChat received typing: {typing: true, userId: A}
✍️ User A started typing in conv XXX
📝 Updated typingUsers for conv XXX: [A]
```

### User A gửi message:
```
USER A:
⌨️ sendTypingIndicator called: {isTyping: false}
✅ Typing status sent to backend

USER B:
🎯 ChatWindow received typing: {typing: false, userId: A}
⏹️ Removed user A from typingUsers
🎯 SideChat received typing: {typing: false, userId: A}
⏹️ User A stopped typing
📝 Updated typingUsers: []
```

---

## ✅ Success Criteria:

- ✅ User A gõ → User B thấy "đang nhập" trong SideChat
- ✅ User A gõ → User B thấy typing indicator (3 chấm) trong ChatWindow
- ✅ User A gửi/xóa → Typing indicator biến mất
- ✅ Typing của chính mình KHÔNG hiển thị
- ✅ Logs chi tiết đầy đủ

---

**RELOAD VÀ TEST NGAY!** ⌨️

Nếu vẫn không hoạt động, paste FULL logs của cả 2 users!

