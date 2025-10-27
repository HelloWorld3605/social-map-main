# 🎯 Hướng Dẫn Sử Dụng Profile Page

## ✅ ĐÃ HOÀN THÀNH

Tôi đã tạo trang cá nhân (Profile Page) với đầy đủ tính năng giống Facebook:

### 📁 Files Đã Tạo

1. **ProfilePage.jsx** - Component trang cá nhân
2. **ProfilePage.css** - Styling giống Facebook
3. **Updated App.jsx** - Thêm routes cho profile
4. **Updated SideChat.jsx** - Lắng nghe sự kiện mở chat
5. **Updated userService.js** - Thêm API methods

---

## 🎨 TÍNH NĂNG

### 1. **Xem Profile**
- ✅ Xem profile của chính mình: `/profile`
- ✅ Xem profile người khác: `/profile/:userId`
- ✅ Cover photo và avatar
- ✅ Thông tin cơ bản (email, ngày tham gia, etc.)
- ✅ Số bạn chung

### 2. **Kết Bạn (Friendship API)**
- ✅ **Thêm bạn bè** - Gửi lời mời kết bạn
- ✅ **Chấp nhận** - Chấp nhận lời mời từ người khác
- ✅ **Từ chối** - Từ chối lời mời
- ✅ **Hủy lời mời** - Hủy lời mời đã gửi
- ✅ **Hủy kết bạn** - Unfriend
- ✅ **Hiển thị trạng thái** - Pending, Accepted, Received

### 3. **Nhắn Tin (Chat Integration)**
- ✅ **Button "Nhắn tin"** - Mở chat window
- ✅ **Tự động tạo conversation** - Nếu chưa có
- ✅ **Hiển thị trong SideChat** - Conversation được thêm vào danh sách
- ✅ **Real-time chat** - WebSocket integration hoàn chỉnh

---

## 🚀 CÁCH SỬ DỤNG

### 1. Truy Cập Profile Page

```javascript
// Từ bất kỳ component nào, navigate đến profile:
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

// Xem profile chính mình
navigate('/profile');

// Xem profile người khác
navigate(`/profile/${userId}`);
```

### 2. Flow Kết Bạn

```
┌─────────────────┐
│  Chưa kết bạn   │ → Click "Thêm bạn bè"
└─────────────────┘
         ↓
┌─────────────────┐
│  Đã gửi lời mời │ → Hiển thị "Hủy lời mời"
│    (PENDING)    │
└─────────────────┘
         ↓
┌─────────────────┐
│   Người khác    │ → Click "Chấp nhận"
│  nhận lời mời   │
│   (RECEIVED)    │
└─────────────────┘
         ↓
┌─────────────────┐
│    Bạn bè       │ → Hiển thị "Bạn bè" + nút Unfriend
│   (ACCEPTED)    │
└─────────────────┘
```

### 3. Flow Nhắn Tin

```javascript
// Khi click button "Nhắn tin":
1. Gọi API: ChatService.getOrCreatePrivateConversation(userId)
2. Nhận conversation object từ backend
3. Dispatch event: window.dispatchEvent('openChatWindow', { conversation })
4. SideChat lắng nghe event
5. Mở ChatWindow tại góc dưới màn hình
6. Conversation hiển thị trong SideChat
```

---

## 🔧 API ENDPOINTS SỬ DỤNG

### User Service
- `GET /api/users/me` - Lấy thông tin user hiện tại
- `GET /api/users/{userId}` - Lấy thông tin user khác
- `GET /api/users/me/mutual-friends/{userId}/count` - Đếm bạn chung

### Friendship Service
- `POST /api/friendships/send-request?receiverId={userId}` - Gửi lời mời
- `POST /api/friendships/accept?senderId={userId}` - Chấp nhận
- `POST /api/friendships/reject?senderId={userId}` - Từ chối
- `DELETE /api/friendships/cancel?receiverId={userId}` - Hủy lời mời
- `DELETE /api/friendships/unfriend?friendId={userId}` - Hủy kết bạn
- `GET /api/friendships/status?userId={userId}` - Lấy trạng thái kết bạn

### Chat Service
- `GET /api/conversations/private/{userId}` - Lấy/tạo conversation với user

---

## 💡 EXAMPLES

### Example 1: Navigate từ Map Popup

```jsx
// Trong PopupMap.jsx hoặc component khác
import { useNavigate } from 'react-router-dom';

function UserMarkerPopup({ user }) {
    const navigate = useNavigate();

    return (
        <div className="popup">
            <h3>{user.displayName}</h3>
            <button onClick={() => navigate(`/profile/${user.id}`)}>
                Xem trang cá nhân
            </button>
        </div>
    );
}
```

### Example 2: Link trong Header Menu

```jsx
// Trong ProfileMenu.jsx
<Link to="/profile">
    <img src="/channels/myprofile.jpg" alt="" />
    <span>Trang cá nhân</span>
</Link>
```

### Example 3: Programmatic Chat Open

```javascript
// Từ bất kỳ đâu trong app
const openChatWithUser = async (userId) => {
    try {
        const conversation = await ChatService.getOrCreatePrivateConversation(userId);
        
        window.dispatchEvent(new CustomEvent('openChatWindow', {
            detail: {
                conversation: conversation,
                minimized: false
            }
        }));
    } catch (error) {
        console.error('Failed to open chat:', error);
    }
};
```

---

## 🎨 CUSTOMIZATION

### Thay Đổi Màu Chủ Đạo

```css
/* Trong ProfilePage.css */
.profile-btn-primary {
    background: #EC5E95; /* Thay đổi màu này */
}

.profile-nav-item.active {
    color: #EC5E95; /* Thay đổi màu này */
    border-bottom-color: #EC5E95;
}
```

### Thêm Tabs Mới

```jsx
// Trong ProfilePage.jsx
<div className="profile-nav">
    <button className="profile-nav-item active">Bài viết</button>
    <button className="profile-nav-item">Giới thiệu</button>
    <button className="profile-nav-item">Bạn bè</button>
    <button className="profile-nav-item">Ảnh</button>
    {/* Thêm tab mới */}
    <button className="profile-nav-item">Videos</button>
</div>
```

---

## 📱 RESPONSIVE DESIGN

Profile Page đã được tối ưu cho:
- ✅ Desktop (> 900px)
- ✅ Tablet (480px - 900px)
- ✅ Mobile (< 480px)

### Breakpoints:
```css
@media (max-width: 900px) { /* Tablet layout */ }
@media (max-width: 768px) { /* Mobile adjustments */ }
@media (max-width: 480px) { /* Small mobile */ }
```

---

## 🔍 TROUBLESHOOTING

### Lỗi: "Cannot read properties of null"
**Nguyên nhân**: User chưa được load  
**Giải pháp**: Component đã có loading state, đợi data load xong

### Lỗi: Không mở được chat window
**Nguyên nhân**: SideChat chưa được mount  
**Giải pháp**: Đảm bảo `<SideChat />` được render trong Layout

### Lỗi: Friendship API không hoạt động
**Nguyên nhân**: Backend chưa implement API  
**Giải pháp**: Kiểm tra FriendshipController và FriendshipService ở backend

---

## 🎯 NEXT STEPS (Tùy Chọn)

Các tính năng có thể thêm:

1. **Posts Timeline** - Hiển thị bài viết của user
2. **Photo Gallery** - Album ảnh
3. **Friends List** - Danh sách bạn bè
4. **Cover Photo Upload** - Upload ảnh bìa
5. **Avatar Upload** - Đổi ảnh đại diện
6. **Edit Profile** - Chỉnh sửa thông tin
7. **Activity Log** - Nhật ký hoạt động
8. **Block User** - Chặn người dùng

---

## 📞 SUPPORT

Nếu gặp vấn đề:
1. Kiểm tra Console logs
2. Xem Network tab trong DevTools
3. Đảm bảo backend đang chạy
4. Kiểm tra JWT token hợp lệ

---

**🎉 Profile Page đã sẵn sàng sử dụng!**

Truy cập: `http://localhost:5173/profile` hoặc `http://localhost:5173/profile/:userId`

