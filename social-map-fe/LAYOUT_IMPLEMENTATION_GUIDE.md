# 🎯 Global Layout Implementation Guide

## ✅ Đã hoàn thành

Hệ thống MainLayout đã được implement thành công vào dự án của bạn!

---

## 📦 Các file đã tạo/cập nhật:

### **Mới tạo:**
1. ✅ `src/components/Layout/MainLayout.jsx` - Layout chính cho toàn bộ app
2. ✅ `src/components/Layout/MainLayout.css` - CSS cho MainLayout
3. ✅ `src/pages/ProfilePage/ProfilePage.jsx` - Trang profile mẫu
4. ✅ `src/pages/ProfilePage/ProfilePage.css` - CSS cho ProfilePage
5. ✅ `src/pages/HomePage/HomePage.css` - CSS cho HomePage

### **Đã cập nhật:**
1. ✅ `src/App.jsx` - Routing với MainLayout
2. ✅ `src/components/Header/Header.jsx` - Thêm transparent mode
3. ✅ `src/components/Header/Header.css` - CSS cho transparent/solid header
4. ✅ `src/pages/HomePage/HomePage.jsx` - Chỉ chứa MapSection

---

## 🚀 Cách hoạt động:

### **1. Homepage (`/home`):**
```
┌─────────────────────────────────────┐
│ Header (Transparent + Blur)         │ ← Đè lên map
├─────────────────────────────────────┤
│                                     │
│         MapSection (Fullscreen)     │
│                                     │
│                                     │
└─────────────────────────────────────┘
│ Sidebar (Fixed Left)                │
│ SideChat (Fixed Right)              │
│ FriendsSidebar (Fixed Right)        │
│ ChatWindows (Floating Bottom Right) │
```

### **2. Profile Page (`/profile`):**
```
┌─────────────────────────────────────┐
│ Header (Solid White)                │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │   Profile Content               │ │
│ │   (padding-top: 60px)           │ │
│ │   (margin-left: 80px)           │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
│ Sidebar (Fixed Left)                │
│ SideChat (Fixed Right)              │
│ ChatWindows (Floating)              │
```

---

## 🎨 Features:

### **Header:**
- ✅ **Transparent mode** ở homepage (blur backdrop)
- ✅ **Solid mode** ở các trang khác
- ✅ **Auto scroll effect** - header đổi opacity khi scroll
- ✅ Responsive design

### **Layout:**
- ✅ **Global components** - Header, Sidebar, SideChat, ChatWindows ở mọi trang
- ✅ **Conditional padding** - Homepage fullscreen, các trang khác có padding
- ✅ **Chat persistence** - Chat windows không đóng khi chuyển trang
- ✅ **Context sharing** - Các page có thể gọi `handleOpenChat()` từ Outlet context

### **Chat System:**
- ✅ Mở chat từ SideChat
- ✅ Mở chat từ FriendsSidebar
- ✅ Mở chat từ bất kỳ component nào (qua `useOutletContext`)
- ✅ Tối đa 3 chat windows cùng lúc
- ✅ Minimize/Close chat windows
- ✅ Chat windows floating ở góc phải dưới

---

## 📝 Cách sử dụng:

### **1. Thêm trang mới:**

```jsx
// src/pages/SettingsPage/SettingsPage.jsx
import { useOutletContext } from 'react-router-dom';

export default function SettingsPage() {
  const { handleOpenChat } = useOutletContext();
  
  return (
    <div className="settings-page">
      <h1>Cài đặt</h1>
      {/* Nội dung trang... */}
      
      {/* Có thể mở chat từ đây */}
      <button onClick={() => handleOpenChat(friendData)}>
        Mở chat
      </button>
    </div>
  );
}
```

**Thêm route vào App.jsx:**
```jsx
import SettingsPage from './pages/SettingsPage/SettingsPage';

// Trong Routes:
<Route path="/settings" element={<SettingsPage />} />
```

### **2. Mở chat từ component:**

```jsx
import { useOutletContext } from 'react-router-dom';

function MyComponent() {
  const { handleOpenChat } = useOutletContext();
  
  const openChatWithUser = (user) => {
    handleOpenChat({
      id: user.id,
      name: user.displayName,
      avatar: user.avatarUrl,
      conversationId: user.conversationId
    });
  };
  
  return (
    <button onClick={() => openChatWithUser(userData)}>
      Chat
    </button>
  );
}
```

### **3. Điều hướng giữa các trang:**

```jsx
import { useNavigate } from 'react-router-dom';

function MyComponent() {
  const navigate = useNavigate();
  
  const goToProfile = () => {
    navigate('/profile');
  };
  
  const goToHome = () => {
    navigate('/home');
  };
}
```

---

## 🔧 Cấu hình:

### **MainLayout.jsx:**
- `isHomePage`: Tự động phát hiện homepage (`/` hoặc `/home`)
- `openChats`: State quản lý danh sách chat windows đang mở
- `handleOpenChat`: Function mở chat window mới
- Tối đa 3 chat windows (có thể thay đổi trong code)

### **Header.jsx:**
- `isTransparent={true}`: Header trong suốt (homepage)
- `isTransparent={false}`: Header solid (các trang khác)
- Auto scroll detection (threshold: 50px)

### **MainLayout.css:**
- `.main-content.no-padding`: Cho homepage (map fullscreen)
- `.main-content.with-padding`: Cho các trang khác
- Sidebar width: 80px (collapsed), 280px (expanded)
- Responsive breakpoint: 768px

---

## 🎯 Routes hiện tại:

| Route | Component | Layout | Access |
|-------|-----------|--------|--------|
| `/login` | LoginPage | ❌ No | Public |
| `/register` | RegisterPage | ❌ No | Public |
| `/validate-token/:token` | ValidateTokenPage | ❌ No | Public |
| `/complete-registration` | CompleteRegistrationPage | ❌ No | Public |
| `/home` | HomePage | ✅ MainLayout | Protected |
| `/profile` | ProfilePage | ✅ MainLayout | Protected |
| `/` | Redirect | - | Auto |
| `/*` | Redirect | - | Auto |

---

## 🧪 Test:

### **1. Test homepage:**
```bash
# Đảm bảo server đang chạy
npm run dev

# Truy cập http://localhost:5174/home
# Kiểm tra:
- ✅ Header trong suốt
- ✅ Map fullscreen
- ✅ Sidebar hiển thị
- ✅ SideChat hiển thị
- ✅ Có thể mở chat
```

### **2. Test profile page:**
```bash
# Truy cập http://localhost:5174/profile
# Kiểm tra:
- ✅ Header solid trắng
- ✅ Nội dung có padding
- ✅ Sidebar hiển thị
- ✅ Chat windows persist khi chuyển trang
- ✅ Button "Test mở chat" hoạt động
```

### **3. Test navigation:**
```bash
# Di chuyển giữa /home và /profile
# Kiểm tra:
- ✅ Chat windows không đóng
- ✅ Header thay đổi style
- ✅ Sidebar vẫn hiển thị
- ✅ Smooth transition
```

---

## 🐛 Troubleshooting:

### **Chat windows không hiển thị:**
- Kiểm tra `ChatWindows.jsx` đã được import đúng chưa
- Kiểm tra `openChats` state có data chưa
- Mở DevTools và xem console có lỗi không

### **Header không trong suốt ở homepage:**
- Kiểm tra `isHomePage` logic trong MainLayout
- Kiểm tra route path có đúng `/home` không
- Xem CSS class có được apply đúng không

### **Nội dung bị đè bởi header:**
- Kiểm tra `.main-content.with-padding` có `padding-top: 60px` chưa
- Kiểm tra header height có đúng 60px chưa

### **Sidebar đè lên nội dung:**
- Kiểm tra `.main-content.with-padding` có `margin-left` chưa
- Sidebar phải có `position: fixed`

---

## 📚 Tài liệu tham khảo:

- **React Router**: `useOutletContext`, `useNavigate`, `useLocation`
- **MapContext**: Global state cho map
- **Layout Pattern**: Nested routes với shared layout
- **Chat System**: Facebook-style chat windows

---

## 🎉 Kết quả:

✅ Header, Sidebar, SideChat, ChatWindows xuất hiện ở **TẤT CẢ** các trang  
✅ Homepage có map fullscreen với header trong suốt  
✅ Các trang khác có header solid với padding hợp lý  
✅ Chat windows persist khi chuyển trang  
✅ Code clean, dễ maintain, dễ mở rộng  

---

**Created**: October 26, 2025  
**Status**: ✅ Ready for production
