# 🔐 Kiến Trúc Bảo Mật Chat Real-time

## ❌ VẤN ĐỀ CŨ - Tại sao KHÔNG nên lấy userId từ localStorage

### 1. **Vấn đề bảo mật**
```javascript
// ❌ KHÔNG AN TOÀN - Client có thể giả mạo userId
const userId = localStorage.getItem('userId');
webSocketService.sendChatMessage({
    senderId: userId,  // ← Có thể bị thay đổi bởi user
    content: "Hello"
});
```

**Hậu quả:**
- User có thể mở DevTools → Application → LocalStorage
- Thay đổi `userId` thành ID của người khác
- Gửi tin nhắn giả mạo danh tính
- **Không thể tin tưởng dữ liệu từ client-side**

### 2. **Vi phạm nguyên tắc bảo mật**
- **Single Source of Truth**: JWT token đã chứa userId, không cần lưu riêng
- **Trust Boundary**: Backend phải là nguồn xác thực duy nhất
- **Defense in Depth**: Không dựa vào client-side validation

---

## ✅ GIẢI PHÁP MỚI - Sử dụng JWT Authentication

### Backend: Lấy userId từ SecurityContext

```java
@MessageMapping("/sendMessage")
public void sendMessage(@Payload ChatMessageDTO chatMessage, 
                       @AuthenticationPrincipal UserPrincipal userPrincipal) {
    
    // ✅ Backend TỰ ĐỘNG lấy userId từ JWT token
    String senderId = userPrincipal.getUser().getId().toString();
    
    // Client KHÔNG THỂ giả mạo senderId
    MessageDTO savedMessage = chatService.sendMessage(senderId, request);
}
```

### Frontend: Chỉ cần gửi nội dung tin nhắn

```javascript
// ✅ AN TOÀN - Không gửi senderId
webSocketService.sendChatMessage({
    conversationId: conversationId,
    content: messageText,
    messageType: 'TEXT'
    // ← Không có senderId, backend sẽ tự lấy từ JWT
});
```

---

## 🔄 LUỒNG AUTHENTICATION ĐẦY ĐỦ

### 1. **Login & Nhận JWT Token**
```
Client                    Backend
  │                          │
  ├──── POST /api/auth/login ──→
  │     { email, password }  │
  │                          │
  ←──── JWT Token ───────────┤
  │     + User Info          │
  │                          │
  └─ Lưu vào localStorage:   │
     - authToken (JWT)       │
     - userInfo (optional)   │
```

### 2. **Kết nối WebSocket với JWT**
```javascript
// Frontend gửi JWT trong header
const socket = new SockJS(`${BASE_URL}/ws`);
this.stompClient = Stomp.over(socket);

this.stompClient.configure({
    connectHeaders: {
        Authorization: `Bearer ${token}` // ← JWT token
    },
    onConnect: (frame) => {
        console.log('Connected!');
    }
});
```

```java
// Backend validate JWT và set Authentication
@Override
public void configureClientInboundChannel(ChannelRegistration registration) {
    registration.interceptors(new ChannelInterceptor() {
        @Override
        public Message<?> preSend(Message<?> message, MessageChannel channel) {
            StompHeaderAccessor accessor = ...;
            
            if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                String token = accessor.getFirstNativeHeader("Authorization");
                
                if (jwtUtils.validateToken(token)) {
                    String email = jwtUtils.getEmailFromToken(token);
                    UserDetails userDetails = customUserDetailsService.loadUserByUsername(email);
                    
                    // Set authentication vào WebSocket session
                    UsernamePasswordAuthenticationToken authentication = 
                        new UsernamePasswordAuthenticationToken(userDetails, null, authorities);
                    
                    accessor.setUser(authentication);
                }
            }
            return message;
        }
    });
}
```

### 3. **Gửi tin nhắn - Backend lấy userId từ SecurityContext**
```
Client                           Backend
  │                                 │
  ├─── /app/sendMessage ───────────→
  │    {                            │
  │      conversationId: "123",     │ 1. Nhận message từ WebSocket
  │      content: "Hello",          │
  │      messageType: "TEXT"        │ 2. Extract user từ @AuthenticationPrincipal
  │    }                            │    String senderId = userPrincipal.getUser().getId()
  │                                 │
  │                                 │ 3. Validate permissions
  │                                 │    - User có trong conversation không?
  │                                 │
  │                                 │ 4. Lưu vào database với ĐÚNG senderId
  │                                 │    message.setSenderId(senderId)
  │                                 │
  ←─── Broadcast to /topic/... ────┤ 5. Broadcast đến tất cả members
  │    {                            │
  │      id: "msg-456",             │
  │      senderId: "REAL_USER_ID", │ ← Backend tự set, không tin client
  │      content: "Hello",          │
  │      timestamp: "..."           │
  │    }                            │
```

---

## 🛡️ LỢI ÍCH BẢO MẬT

### 1. **Không thể giả mạo danh tính**
```javascript
// ❌ Client cố gắng giả mạo (KHÔNG HIỆU QUẢ)
webSocketService.sendChatMessage({
    senderId: "other-user-id",  // ← Backend sẽ BỎ QUA
    content: "Fake message"
});

// ✅ Backend luôn dùng userId từ JWT
String trueSenderId = userPrincipal.getUser().getId(); // ← Luôn đúng
```

### 2. **JWT không thể giả mạo**
- JWT được ký bởi `SECRET_KEY` của server
- Client không thể tạo JWT hợp lệ
- Mỗi request được validate bởi `JwtUtils.validateToken()`

### 3. **Session isolation**
- Mỗi WebSocket connection có riêng SecurityContext
- User A không thể access dữ liệu của User B
- Backend kiểm tra permissions trước khi xử lý

---

## 📋 CHECKLIST MIGRATION

### Backend ✅
- [x] `@AuthenticationPrincipal UserPrincipal` trong tất cả endpoints
- [x] Lấy userId từ `userPrincipal.getUser().getId()`
- [x] Validate JWT trong WebSocket interceptor
- [x] Không trust userId từ client request body

### Frontend ✅
- [x] Loại bỏ `localStorage.getItem('userId')` 
- [x] Chỉ gửi JWT token trong header
- [x] Không gửi `senderId` trong message payload
- [x] currentUserId chỉ dùng cho UI (hiển thị "Bạn:", phân biệt sent/received)
- [x] currentUserId lấy từ WebSocket service (đã fetch từ backend)

---

## 🔍 SO SÁNH TRƯỚC & SAU

### TRƯỚC (❌ Không an toàn)
```javascript
// Frontend
const userId = localStorage.getItem('userId'); // ← Có thể bị giả mạo
webSocketService.sendMessage({
    senderId: userId,  // ← Tin tưởng client
    content: "Hello"
});

// Backend
@MessageMapping("/sendMessage")
public void sendMessage(@Payload ChatMessageDTO message) {
    // ❌ Dùng senderId từ client - KHÔNG AN TOÀN
    String senderId = message.getSenderId();
    chatService.save(senderId, message);
}
```

### SAU (✅ An toàn)
```javascript
// Frontend
webSocketService.sendMessage({
    // Không có senderId
    content: "Hello"
});

// Backend
@MessageMapping("/sendMessage")
public void sendMessage(@Payload ChatMessageDTO message,
                       @AuthenticationPrincipal UserPrincipal userPrincipal) {
    
    // ✅ Lấy senderId từ JWT - AN TOÀN
    String senderId = userPrincipal.getUser().getId().toString();
    chatService.save(senderId, message);
}
```

---

## 🎯 KẾT LUẬN

### ✅ ĐÚNG
- JWT token là nguồn xác thực DUY NHẤT
- Backend lấy userId từ `@AuthenticationPrincipal`
- Client chỉ cần JWT token trong header
- `localStorage` chỉ lưu `authToken`, không lưu `userId` riêng

### ❌ SAI
- Lấy userId từ `localStorage` để gửi lên server
- Trust dữ liệu userId từ client
- Lưu userId riêng biệt với JWT token
- Cho phép client tự set senderId

---

## 📚 TÀI LIỆU THAM KHẢO

- [OWASP - Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Spring Security Architecture](https://spring.io/guides/topicals/spring-security-architecture)
- [WebSocket Security](https://devcenter.heroku.com/articles/websocket-security)

---

**Nguyên tắc vàng:** 
> "Never trust the client. Always validate on the server."
> — Luôn xác thực trên server, không bao giờ tin tưởng client.

