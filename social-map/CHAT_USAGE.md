# Hướng dẫn sử dụng Chat Realtime

## 📋 Tổng quan

Hệ thống chat realtime sử dụng:
- **WebSocket (STOMP)** cho giao tiếp realtime
- **MongoDB** để lưu trữ tin nhắn và conversations
- **PostgreSQL** cho dữ liệu user

---

## 🔌 Kết nối WebSocket

### Frontend kết nối:

```javascript
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

// Kết nối WebSocket
const socket = new SockJS('http://localhost:8080/ws');
const stompClient = Stomp.over(socket);

stompClient.connect({}, (frame) => {
    console.log('Connected: ' + frame);
    
    // Subscribe nhận tin nhắn từ conversation
    stompClient.subscribe('/topic/conversation/{conversationId}', (message) => {
        const receivedMessage = JSON.parse(message.body);
        console.log('New message:', receivedMessage);
        // Hiển thị tin nhắn trong UI
    });
    
    // Subscribe nhận unread count
    stompClient.subscribe('/user/queue/unread', (message) => {
        const unreadData = JSON.parse(message.body);
        console.log('Unread count:', unreadData);
        // Cập nhật badge số tin chưa đọc
    });
    
    // Subscribe nhận lỗi
    stompClient.subscribe('/user/queue/errors', (error) => {
        console.error('Error:', error.body);
    });
});
```

---

## 📨 Gửi tin nhắn (WebSocket)

```javascript
// Gửi tin nhắn
stompClient.send('/app/sendMessage', {}, JSON.stringify({
    conversationId: '67890abcdef',
    senderId: 'user-uuid-123',
    content: 'Hello World!',
    messageType: 'TEXT'
}));
```

---

## ⌨️ Typing Indicator

```javascript
// Bắt đầu typing
stompClient.send('/app/typing', {}, JSON.stringify({
    conversationId: '67890abcdef',
    userId: 'user-uuid-123',
    username: 'John Doe',
    isTyping: true
}));

// Subscribe để nhận typing status
stompClient.subscribe('/topic/conversation/{conversationId}/typing', (message) => {
    const typingData = JSON.parse(message.body);
    if (typingData.isTyping) {
        console.log(`${typingData.username} đang gõ...`);
    }
});
```

---

## 🌐 REST API Endpoints

### 1. Tạo conversation mới

**POST** `/api/conversations`

```json
{
  "memberIds": ["user-uuid-1", "user-uuid-2"],
  "isGroup": false,
  "groupName": null
}
```

**Response:**
```json
{
  "id": "conv-12345",
  "isGroup": false,
  "groupName": null,
  "createdBy": "user-uuid-1",
  "createdAt": "2025-10-14T10:00:00",
  "memberIds": ["user-uuid-1", "user-uuid-2"],
  "messageIds": []
}
```

---

### 2. Lấy hoặc tạo chat private với user khác

**GET** `/api/conversations/private/{otherUserId}`

**Response:** Trả về conversation hiện có hoặc tạo mới

---

### 3. Lấy danh sách conversations của user

**GET** `/api/conversations`

**Response:**
```json
[
  {
    "id": "conv-12345",
    "isGroup": false,
    "groupName": null,
    "createdBy": "user-uuid-1",
    "createdAt": "2025-10-14T10:00:00",
    "memberIds": ["user-uuid-1", "user-uuid-2"],
    "lastMessage": {
      "id": "msg-999",
      "senderId": "user-uuid-2",
      "senderName": "Jane Doe",
      "content": "Hi there!",
      "type": "TEXT",
      "createdAt": "2025-10-14T11:30:00",
      "isRead": false
    },
    "unreadCount": 3
  }
]
```

---

### 4. Lấy lịch sử tin nhắn (phân trang)

**GET** `/api/conversations/{conversationId}/messages?page=0&size=50`

**Response:**
```json
{
  "content": [
    {
      "id": "msg-123",
      "conversationId": "conv-12345",
      "senderId": "user-uuid-1",
      "senderName": "John Doe",
      "content": "Hello!",
      "type": "TEXT",
      "createdAt": "2025-10-14T10:00:00",
      "isRead": true
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 50
  },
  "totalElements": 100
}
```

---

### 5. Đánh dấu tin nhắn đã đọc

**POST** `/api/conversations/{conversationId}/read`

**Response:** 200 OK

---

### 6. Lấy số tin chưa đọc

**GET** `/api/conversations/{conversationId}/unread-count`

**Response:** `5`

---

### 7. Thêm member vào nhóm (chỉ admin)

**POST** `/api/conversations/{conversationId}/members/{memberId}`

---

### 8. Xóa member hoặc rời nhóm

**DELETE** `/api/conversations/{conversationId}/members/{memberId}`

---

## 🔐 Authentication

Tất cả API đều yêu cầu JWT token:

```javascript
fetch('/api/conversations', {
  headers: {
    'Authorization': 'Bearer ' + accessToken
  }
})
```

---

## 💡 Ví dụ tích hợp React

```jsx
import React, { useEffect, useState } from 'react';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

function ChatComponent({ conversationId, userId }) {
  const [messages, setMessages] = useState([]);
  const [stompClient, setStompClient] = useState(null);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    // Kết nối WebSocket
    const socket = new SockJS('http://localhost:8080/ws');
    const client = Stomp.over(socket);
    
    client.connect({}, () => {
      // Subscribe conversation
      client.subscribe(`/topic/conversation/${conversationId}`, (message) => {
        const newMessage = JSON.parse(message.body);
        setMessages(prev => [...prev, newMessage]);
      });
      
      setStompClient(client);
    });

    // Load lịch sử tin nhắn
    fetch(`/api/conversations/${conversationId}/messages?page=0&size=50`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })
    .then(res => res.json())
    .then(data => setMessages(data.content));

    return () => client?.disconnect();
  }, [conversationId]);

  const sendMessage = () => {
    if (stompClient && inputText.trim()) {
      stompClient.send('/app/sendMessage', {}, JSON.stringify({
        conversationId,
        senderId: userId,
        content: inputText
      }));
      setInputText('');
    }
  };

  return (
    <div>
      <div className="messages">
        {messages.map(msg => (
          <div key={msg.id}>
            <strong>{msg.senderName}:</strong> {msg.content}
          </div>
        ))}
      </div>
      <input 
        value={inputText} 
        onChange={e => setInputText(e.target.value)}
        onKeyPress={e => e.key === 'Enter' && sendMessage()}
      />
      <button onClick={sendMessage}>Gửi</button>
    </div>
  );
}
```

---

## 🎯 Luồng hoạt động

1. **User mở trang chat:**
   - Frontend kết nối WebSocket đến `/ws`
   - Gọi API `/api/conversations` để lấy danh sách cuộc hội thoại
   - Subscribe `/topic/conversation/{id}` cho mỗi conversation

2. **User chọn conversation:**
   - Gọi API `/api/conversations/{id}/messages` để load lịch sử
   - Đánh dấu đã đọc: POST `/api/conversations/{id}/read`

3. **User gửi tin nhắn:**
   - Gửi qua WebSocket `/app/sendMessage`
   - Server lưu vào MongoDB
   - Broadcast đến tất cả members qua `/topic/conversation/{id}`
   - Gửi unread count cho members khác qua `/user/queue/unread`

4. **User nhận tin nhắn:**
   - Frontend nhận qua subscription `/topic/conversation/{id}`
   - Hiển thị realtime trong UI
   - Cập nhật badge số tin chưa đọc

---

## 📊 Cấu trúc dữ liệu MongoDB

### Collection: conversations
```json
{
  "_id": "conv-12345",
  "isGroup": false,
  "groupName": null,
  "createdBy": "user-uuid-1",
  "createdAt": "2025-10-14T10:00:00",
  "memberIds": ["user-uuid-1", "user-uuid-2"],
  "messageIds": ["msg-1", "msg-2"]
}
```

### Collection: messages
```json
{
  "_id": "msg-123",
  "conversationId": "conv-12345",
  "senderId": "user-uuid-1",
  "content": "Hello!",
  "type": "TEXT",
  "createdAt": "2025-10-14T10:00:00",
  "isRead": false
}
```

### Collection: conversation_members
```json
{
  "_id": "member-456",
  "conversationId": "conv-12345",
  "userId": "user-uuid-1",
  "joinedAt": "2025-10-14T10:00:00",
  "lastReadAt": "2025-10-14T11:00:00"
}
```

---

## ⚠️ Lưu ý

1. **senderId phải là UUID string** của user từ PostgreSQL
2. **conversationId là MongoDB ObjectId** (string)
3. Unread count được tính dựa trên `lastReadAt` của member
4. Typing indicator không được lưu vào database (chỉ broadcast realtime)
5. WebSocket endpoint: `http://localhost:8080/ws` (hoặc `http://localhost:5173` nếu dùng frontend URL)

---

## 🐛 Troubleshooting

**Lỗi: "User is not a member of this conversation"**
→ Đảm bảo user đã được thêm vào conversation.memberIds

**WebSocket không kết nối được:**
→ Kiểm tra CORS trong `WebSocketConfig` đã cho phép origin frontend

**Authentication failed:**
→ Đảm bảo gửi JWT token khi kết nối WebSocket (nếu cần bảo mật)

