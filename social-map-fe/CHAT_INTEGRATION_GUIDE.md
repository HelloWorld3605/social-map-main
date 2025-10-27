# 🚀 Hướng Dẫn Tích Hợp Chat Real-time

## ✅ Đã Hoàn Thành

### 📁 Files Đã Tạo/Cập Nhật

1. **SideChat.jsx** - Component hiển thị danh sách conversations
   - ✅ Hiển thị tất cả conversations của user
   - ✅ WebSocket real-time cho tin nhắn mới
   - ✅ Hiển thị typing indicator
   - ✅ Hiển thị tin nhắn cuối cùng
   - ✅ Hiển thị số tin nhắn chưa đọc (unread count)
   - ✅ Tìm kiếm conversations
   - ✅ Kết nối WebSocket tự động

2. **ChatWindow.jsx** - Component cửa sổ chat
   - ✅ Gửi và nhận tin nhắn real-time
   - ✅ Hiển thị lịch sử tin nhắn với phân trang
   - ✅ Scroll tự động và load more khi scroll lên
   - ✅ Typing indicator real-time
   - ✅ Hỗ trợ nhiều cửa sổ chat cùng lúc
   - ✅ Thu nhỏ/mở rộng cửa sổ chat
   - ✅ Linkify URLs tự động

3. **ChatService.js** - Service tích hợp backend
   - ✅ Tất cả REST API endpoints
   - ✅ WebSocket service với SockJS & STOMP
   - ✅ Quản lý subscriptions tự động

4. **CSS Files**
   - ✅ Chat.css - Styling cho SideChat
   - ✅ ChatWindows.css - Styling cho ChatWindow
   - ✅ Dark mode support
   - ✅ Responsive design

## 🎯 Tính Năng Chính

### Real-time Chat như Facebook
- ✅ Gửi/nhận tin nhắn ngay lập tức qua WebSocket
- ✅ Typing indicator (hiển thị khi người khác đang nhập)
- ✅ Unread count tự động cập nhật
- ✅ Tin nhắn cuối cùng hiển thị real-time

### Phân Trang & Scroll
- ✅ Load 20 tin nhắn mỗi lần
- ✅ Load more khi scroll lên đầu
- ✅ Giữ vị trí scroll khi load thêm
- ✅ Auto scroll xuống với tin nhắn mới

### UI/UX
- ✅ Facebook-style chat windows ở góc dưới
- ✅ Có thể mở nhiều chat cùng lúc
- ✅ Thu nhỏ/mở rộng từng cửa sổ
- ✅ Responsive trên mobile
- ✅ Dark mode support

## 🔧 Cách Sử Dụng

### 1. Import Component

```jsx
// Trong App.jsx hoặc Layout component
import SideChat from './components/Chat/SideChat';

function App() {
  return (
    <div>
      {/* Your other components */}
      <SideChat />
    </div>
  );
}
```

### 2. Backend Requirements

Đảm bảo backend đang chạy với:
- ✅ WebSocket endpoint: `ws://localhost:8080/ws`
- ✅ REST API: `http://localhost:8080/api`
- ✅ JWT Authentication

### 3. LocalStorage Requirements

Component cần các giá trị trong localStorage:
```javascript
localStorage.setItem('authToken', 'your-jwt-token');
localStorage.setItem('userId', 'user-id');
```

## 📡 WebSocket Integration

### Kết Nối
```javascript
// Tự động kết nối khi SideChat mount
webSocketService.connect(onConnected, onError);
```

### Subscribe Topics
```javascript
// Messages cho conversation
/topic/conversation/{conversationId}

// Typing indicators
/topic/conversation/{conversationId}/typing

// Message updates (edit/delete)
/topic/conversation/{conversationId}/update

// Unread count (private)
/user/queue/unread

// Errors (private)
/user/queue/errors
```

### Send Messages
```javascript
// Gửi tin nhắn
webSocketService.sendChatMessage({
  senderId: currentUserId,
  conversationId: conversationId,
  content: messageText,
  messageType: 'TEXT'
});

// Gửi typing status
webSocketService.sendTypingStatus({
  conversationId: conversationId,
  userId: currentUserId,
  isTyping: true
});
```

## 🎨 Styling

### Tùy Chỉnh Màu Sắc
Trong `Chat.css` và `ChatWindows.css`, thay đổi:
```css
/* Primary color - màu chính của chat */
background: #EC5E95;  /* Đổi thành màu bạn muốn */
```

### Responsive Breakpoints
- Desktop: > 768px
- Tablet: 480px - 768px
- Mobile: < 480px

## 🔍 Troubleshooting

### WebSocket không kết nối?
1. Kiểm tra backend có đang chạy không
2. Kiểm tra authToken trong localStorage
3. Mở Console để xem lỗi WebSocket

### Tin nhắn không hiển thị?
1. Kiểm tra API endpoint `/api/conversations`
2. Kiểm tra userId trong localStorage
3. Xem Network tab trong DevTools

### Typing indicator không hoạt động?
1. Kiểm tra WebSocket topic `/topic/conversation/{id}/typing`
2. Đảm bảo backend đang broadcast typing status

## 📱 Features Chi Tiết

### SideChat Component
```jsx
<SideChat />
```

**State:**
- `conversations` - Danh sách các cuộc trò chuyện
- `isConnected` - Trạng thái WebSocket
- `searchQuery` - Tìm kiếm conversation

**Features:**
- Click vào conversation để mở chat window
- Hiển thị unread count badge màu hồng
- Hiển thị typing indicator trong danh sách
- Search conversations theo tên
- Auto-refresh khi có tin nhắn mới

### ChatWindow Component
```jsx
<ChatWindow 
  conversation={conversation}
  minimized={false}
  onClose={handleClose}
  onMinimize={handleMinimize}
  onNewMessage={handleNewMessage}
/>
```

**Props:**
- `conversation` - Object conversation data
- `minimized` - Boolean để thu nhỏ/mở rộng
- `onClose` - Callback khi đóng window
- `onMinimize` - Callback khi thu nhỏ
- `onNewMessage` - Callback khi có tin nhắn mới

**Features:**
- Load messages với pagination
- Scroll to bottom tự động
- Load more khi scroll lên
- Real-time typing indicator
- Send message với Enter
- Linkify URLs
- Format thời gian tin nhắn

## 🚦 Status Indicators

### Online/Offline Status
```jsx
// Trong conversation display
status: otherUser?.online ? 'Đang hoạt động' : 'Không hoạt động'
```

### Connection Status
```jsx
// Hiển thị khi WebSocket disconnect
{!isConnected && (
  <div className="chat-connection-status">
    <span className="connection-indicator offline">●</span>
    Đang kết nối lại...
  </div>
)}
```

## 🔐 Security

- ✅ JWT token tự động gửi với mỗi request
- ✅ WebSocket authentication với Bearer token
- ✅ Private topics cho unread counts
- ✅ Validation userId trước khi gửi

## 🎯 Next Steps (Tùy chọn)

Các tính năng có thể thêm:
- [ ] Gửi ảnh/file
- [ ] Emoji picker
- [ ] Message reactions
- [ ] Voice/Video call
- [ ] Seen/Read receipts
- [ ] Delete messages
- [ ] Edit messages
- [ ] Pin conversations
- [ ] Mute notifications

## 📞 Support

Nếu gặp vấn đề, kiểm tra:
1. Console logs trong browser
2. Network tab để xem API calls
3. Backend logs cho WebSocket connections
4. localStorage có đúng authToken và userId không

---

**🎉 Chúc bạn code vui vẻ!**

