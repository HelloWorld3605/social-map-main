# WebSocket Connection Fix - Đăng nhập không cần reload

## Vấn đề
Khi đăng nhập lại, WebSocket không tự động kết nối và hiển thị lỗi:
- `apiClient.js:38 ⚠️ No token found in localStorage!`
- `SideChat.jsx:134 ⚠️ WebSocket vẫn chưa connected sau retry. Chờ event...`
- Phải reload trang thì mới kết nối được và hoạt động bình thường

## Nguyên nhân
1. `App.jsx` chỉ connect WebSocket trong `useEffect` với dependency array rỗng `[]`
2. Component App đã mount lúc đầu ở trang login (khi chưa có token)
3. Khi login thành công và navigate sang `/home`, App không unmount/remount
4. Do đó `useEffect` không chạy lại để kết nối WebSocket với token mới
5. Chỉ khi reload page, App mới mount lại và kết nối WebSocket thành công

## Giải pháp
### 1. Thêm login event listener vào App.jsx
- Tạo function `connectWebSocket()` để tái sử dụng logic kết nối
- Lắng nghe event `login` để kết nối WebSocket sau khi đăng nhập thành công
- Lắng nghe event `logout` để ngắt kết nối (đã có sẵn)

**File:** `social-map-fe/src/App.jsx`
```javascript
useEffect(() => {
  const connectWebSocket = () => {
    const token = localStorage.getItem('authToken');
    
    if (token && isTokenExpired(token)) {
      // Handle expired token...
      return;
    }
    
    if (token) {
      webSocketService.connect(/* ... */);
    }
  };

  // Kết nối ngay khi mount
  connectWebSocket();

  // Lắng nghe login event
  const handleLogin = () => {
    console.log('🔐 Login event received - connecting WebSocket');
    connectWebSocket();
  };

  window.addEventListener('login', handleLogin);
  
  return () => {
    window.removeEventListener('login', handleLogin);
  };
}, []);
```

### 2. Dispatch login event sau khi đăng nhập thành công
**File:** `social-map-fe/src/pages/Auth/login-page.jsx`
```javascript
// Sau khi lưu token và user info
localStorage.setItem('authToken', token);
localStorage.setItem('user', JSON.stringify(user));

// Dispatch login event
console.log('📢 Dispatching login event...');
window.dispatchEvent(new Event('login'));

// Navigate to home
navigate('/home', { replace: true });
```

### 3. Thêm validation
- Throw error nếu không nhận được token từ server
- Đảm bảo token được lưu vào localStorage trước khi dispatch event

## Flow hoạt động mới
1. User đăng nhập → `login-page.jsx`
2. Lưu token vào localStorage
3. Dispatch event `login`
4. `App.jsx` nhận event `login`
5. Gọi `connectWebSocket()` để kết nối với token mới
6. WebSocket connected thành công
7. Navigate sang `/home`
8. Chat và các tính năng realtime hoạt động ngay lập tức

## Test
1. Đăng xuất khỏi ứng dụng
2. Đăng nhập lại
3. Kiểm tra console log:
   - ✅ `📢 Dispatching login event...`
   - ✅ `🔐 Login event received - connecting WebSocket`
   - ✅ `🌐 Kết nối WebSocket toàn cục`
   - ✅ `✅ Global WebSocket connected`
4. Kiểm tra chat hoạt động ngay mà không cần reload

## Files đã thay đổi
- `social-map-fe/src/App.jsx` - Thêm login event listener
- `social-map-fe/src/pages/Auth/login-page.jsx` - Dispatch login event + validation

