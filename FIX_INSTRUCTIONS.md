# Hướng dẫn sửa lỗi WebSocket không kết nối sau khi đăng nhập

## ✅ Code đã được cập nhật
Tôi đã thêm logic để tự động kết nối WebSocket sau khi đăng nhập mà không cần reload trang.

## 🔄 Cần làm để áp dụng thay đổi

### Bước 1: Hard Refresh Browser
Browser của bạn đang cache code JavaScript cũ. Hãy làm như sau:

**Trên Chrome/Edge:**
- Nhấn `Ctrl + Shift + R` (Windows/Linux)
- Hoặc `Ctrl + F5`
- Hoặc mở DevTools (F12) → Click chuột phải vào nút Reload → chọn "Empty Cache and Hard Reload"

**Trên Firefox:**
- Nhấn `Ctrl + Shift + R`
- Hoặc `Ctrl + F5`

### Bước 2: Hoặc Clear Cache và Reload
1. Mở DevTools (F12)
2. Đi tới tab Application (Chrome) hoặc Storage (Firefox)
3. Click vào "Clear site data" hoặc "Clear all storage"
4. Reload trang (F5)

### Bước 3: Kiểm tra Vite Dev Server
Nếu bạn đang chạy dev server, có thể cần restart:
```cmd
# Dừng server hiện tại (Ctrl + C)
# Sau đó chạy lại:
cd D:\Spring-boot\social-map-main\social-map-fe
npm run dev
```

## 🧪 Test sau khi áp dụng

1. **Đăng xuất** khỏi ứng dụng
2. **Đăng nhập lại**
3. **Kiểm tra Console Log** - bạn sẽ thấy:
   ```
   login-page.jsx:XXX 📢 Dispatching login event...
   App.jsx:XXX 🔐 Login event received - connecting WebSocket
   App.jsx:XXX 🌐 Kết nối WebSocket toàn cục
   [WebSocket] Connecting with token (length): XXX
   ✅ Connected to WebSocket
   ✅ Global WebSocket connected
   ```

4. **Kiểm tra Chat** - Chat sẽ hoạt động ngay mà không cần reload

## 📝 Các thay đổi đã thực hiện

### File: `social-map-fe/src/App.jsx`
- ✅ Thêm event listener cho event `login`
- ✅ Tạo function `connectWebSocket()` để tái sử dụng
- ✅ Tự động kết nối WebSocket khi nhận được event `login`

### File: `social-map-fe/src/pages/Auth/login-page.jsx`
- ✅ Dispatch event `login` sau khi lưu token thành công
- ✅ Thêm validation: throw error nếu không nhận được token
- ✅ Cải thiện logging để dễ debug

## ❓ Nếu vẫn không hoạt động

1. **Kiểm tra Console Log**: Xem có dòng `📢 Dispatching login event...` không?
   - Nếu KHÔNG có → Browser vẫn cache code cũ → Làm lại Bước 1 & 2
   - Nếu CÓ → Kiểm tra có lỗi gì ở App.jsx không

2. **Kiểm tra Network Tab**: Xem có request `/ws` không?
   - Nếu có → Kiểm tra status code
   - Nếu 401 → Token có vấn đề
   - Nếu 500 → Backend có lỗi

3. **Restart toàn bộ**:
   ```cmd
   # Stop backend (nếu đang chạy)
   # Stop frontend
   # Start backend lại
   # Start frontend lại
   npm run dev
   ```

## 📊 So sánh Log

### ❌ Log CŨ (trước khi fix):
```
login-page.jsx:135 Đang chuyển hướng đến /home...
SideChat.jsx:134 ⚠️ WebSocket vẫn chưa connected sau retry. Chờ event...
```

### ✅ Log MỚI (sau khi fix):
```
login-page.jsx:139 📢 Dispatching login event...
login-page.jsx:143 Đang chuyển hướng đến /home...
App.jsx:47 🔐 Login event received - connecting WebSocket
App.jsx:37 🌐 Kết nối WebSocket toàn cục
✅ Connected to WebSocket
✅ Global WebSocket connected
```

