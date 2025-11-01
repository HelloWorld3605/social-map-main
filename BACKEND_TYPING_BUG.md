# 🐛 CRITICAL BUG FOUND - Backend Always Sends `typing: false`!

## 📊 Phân tích logs:

### User A (gửi typing):
```
⌨️ sendTypingIndicator called: {isTyping: true, ...}  ← Frontend gửi TRUE
WebSocket sendTypingStatus called: {isTyping: true}   ← Confirm TRUE
Publishing typing status to /app/typing with token: true
Publish successful
✅ Typing status sent to backend

// Nhưng nhận lại:
🎯 ChatWindow received typing: {typing: false, ...}   ← Backend trả FALSE!!! 🐛
⏭️ Skipping typing from self (currentUser)
```

### User B (nhận typing):
```
⏹️ User 2f4876... stopped typing                      ← CHỈ nhận FALSE!
📝 Updated typingUsers: []                             ← Array rỗng
ChatWindow ⏹️ Removed user ...: Before: 0 After: 0    ← Không có user nào
```

**KHÔNG THẤY:**
```
✍️ User started typing  ← KHÔNG CÓ!
```

---

## 🎯 ROOT CAUSE:

**Backend luôn broadcast `typing: false` bất kể frontend gửi `isTyping: true`!**

### Backend có thể có bug ở đây:

```java
// Backend code (giả định)
@MessageMapping("/typing")
public void handleTyping(TypingDTO typingDTO, Principal principal) {
    // BUG: Không set isTyping từ request!
    typingDTO.setUserId(principal.getName());
    typingDTO.setUsername(...);
    // typingDTO.setTyping(...) ← THIẾU! Luôn là false (default value)
    
    messagingTemplate.convertAndSend(
        "/topic/conversation/" + typingDTO.getConversationId() + "/typing",
        typingDTO  // ← Gửi với typing=false
    );
}
```

---

## ✅ FIX BACKEND:

### Cần kiểm tra backend code:

**File cần check:** `ChatWebSocketController.java` (hoặc tương tự)

**Method:** `@MessageMapping("/typing")`

**Fix cần apply:**

```java
@MessageMapping("/typing")
public void handleTyping(TypingDTO typingDTO, Principal principal) {
    log.info("handleTyping called with typingDTO: {}", typingDTO);
    
    UserPrincipal userPrincipal = (UserPrincipal) ((UsernamePasswordAuthenticationToken) principal).getPrincipal();
    
    // ✅ QUAN TRỌNG: Giữ nguyên isTyping từ request!
    // KHÔNG tạo DTO mới nếu nó sẽ mất isTyping value
    
    typingDTO.setUserId(userPrincipal.getUserId());
    typingDTO.setUsername(userPrincipal.getFullName());
    // typingDTO.isTyping() should KEEP original value from frontend!
    
    log.info("Backend sending typing: {}", typingDTO);  // ← Check log này!
    
    messagingTemplate.convertAndSend(
        "/topic/conversation/" + typingDTO.getConversationId() + "/typing",
        typingDTO
    );
}
```

**Hoặc nếu backend tạo DTO mới:**

```java
// SAI:
TypingDTO response = new TypingDTO();
response.setConversationId(typingDTO.getConversationId());
response.setUserId(userId);
response.setUsername(username);
// response.setTyping(...) ← THIẾU! Default = false

// ĐÚNG:
TypingDTO response = new TypingDTO();
response.setConversationId(typingDTO.getConversationId());
response.setUserId(userId);
response.setUsername(username);
response.setTyping(typingDTO.isTyping());  // ← COPY từ request!
// Hoặc:
response.setIsTyping(typingDTO.getIsTyping());
```

---

## 🔍 VERIFY BACKEND LOGS:

Backend logs bạn đã paste:
```
handleTyping called with typingDTO: TypingDTO(
    conversationId=68ffb..., 
    userId=null, 
    username=null, 
    isTyping=false  ← ??? Sao là FALSE khi frontend gửi TRUE?
)

Backend sending typing: TypingDTO(
    conversationId=68ffb..., 
    userId=2f4876..., 
    username=Hải Phùng, 
    isTyping=false  ← Vẫn FALSE!
)
```

**2 possibilities:**

### 1. Frontend gửi sai (KHÔNG PHẢI - logs confirm frontend gửi TRUE)

### 2. Backend deserialization issue:

**Frontend gửi:**
```json
{
  "conversationId": "68ffb...",
  "isTyping": true
}
```

**Backend nhận (TypingDTO class):**
```java
public class TypingDTO {
    private String conversationId;
    private String userId;
    private String username;
    private boolean isTyping;  // ← Default = false nếu không được set!
    
    // Getters/Setters
    public boolean isTyping() { return isTyping; }
    public void setTyping(boolean typing) { this.isTyping = typing; }
    
    // HOẶC có thể có vấn đề với naming:
    public boolean getIsTyping() { return isTyping; }
    public void setIsTyping(boolean typing) { this.isTyping = typing; }
}
```

**Vấn đề có thể:** Jackson không deserialize đúng field `isTyping` vì naming convention!

**Fix backend DTO:**

```java
public class TypingDTO {
    private String conversationId;
    private String userId;
    private String username;
    
    @JsonProperty("isTyping")  // ← Explicitly map
    private boolean typing;     // ← Field name = "typing"
    
    // Getters/Setters
    public boolean isTyping() { return typing; }
    public void setTyping(boolean typing) { this.typing = typing; }
}
```

---

## 🧪 DEBUG BACKEND:

### Thêm logs vào backend:

```java
@MessageMapping("/typing")
public void handleTyping(TypingDTO typingDTO, Principal principal) {
    // ADD THIS LOG:
    log.info("📥 RECEIVED from frontend: conversationId={}, isTyping={}", 
        typingDTO.getConversationId(), 
        typingDTO.isTyping());  // ← Check giá trị NGAY SAU KHI nhận!
    
    UserPrincipal userPrincipal = (UserPrincipal) ((UsernamePasswordAuthenticationToken) principal).getPrincipal();
    
    typingDTO.setUserId(userPrincipal.getUserId());
    typingDTO.setUsername(userPrincipal.getFullName());
    
    // ADD THIS LOG:
    log.info("📤 SENDING to topic: conversationId={}, userId={}, username={}, isTyping={}", 
        typingDTO.getConversationId(),
        typingDTO.getUserId(),
        typingDTO.getUsername(),
        typingDTO.isTyping());  // ← Check giá trị TRƯỚC KHI broadcast!
    
    messagingTemplate.convertAndSend(
        "/topic/conversation/" + typingDTO.getConversationId() + "/typing",
        typingDTO
    );
}
```

Khi User A gõ, backend logs NÊN thấy:
```
📥 RECEIVED from frontend: conversationId=68ffb..., isTyping=true
📤 SENDING to topic: conversationId=68ffb..., userId=2f4876..., username=Hải Phùng, isTyping=true
```

Nếu thấy `isTyping=false` trong log `📥 RECEIVED` → Jackson deserialization bug!

---

## 🔧 FRONTEND WORKAROUND (Tạm thời):

Nếu không thể fix backend ngay, có thể workaround bằng cách gửi cả `typing` và `isTyping`:

```javascript
// In ChatService.js sendTypingStatus()
this.stompClient.publish({
    destination: '/app/typing',
    body: JSON.stringify({
        conversationId,
        typing: isTyping,      // ← Thêm field "typing"
        isTyping: isTyping     // ← Giữ field "isTyping"
    })
});
```

Backend sẽ deserialize một trong hai!

---

## ✅ ACTION REQUIRED:

### 1. CHECK BACKEND CODE:
- File: `ChatWebSocketController.java` (hoặc tương tự)
- Method: `@MessageMapping("/typing")`
- Verify: `typingDTO.isTyping()` được preserve từ request

### 2. CHECK BACKEND DTO:
- File: `TypingDTO.java`
- Field naming: `isTyping` vs `typing`
- Getter/Setter naming: `isTyping()` vs `getIsTyping()`
- Add `@JsonProperty("isTyping")` nếu cần

### 3. ADD BACKEND LOGS:
- Log giá trị `isTyping` NGAY SAU khi nhận từ frontend
- Log giá trị `isTyping` TRƯỚC KHI broadcast

### 4. TEST:
- User A gõ
- Check backend logs có `isTyping=true` không
- User B NÊN nhận được `typing: true`

---

## 📋 Summary:

**Vấn đề:** Backend luôn broadcast `typing: false`

**Nguyên nhân:** Backend không preserve `isTyping` value từ frontend request

**Fix:** 
1. Backend: Giữ nguyên `isTyping` từ request
2. Hoặc fix DTO deserialization
3. Hoặc frontend workaround gửi cả 2 fields

**Status:** ⚠️ BACKEND BUG - Cần fix backend code!

---

**NEXT:** Check và fix backend code, sau đó test lại!

