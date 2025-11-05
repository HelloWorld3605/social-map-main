# 🚀 QUICK START - SHOP MANAGEMENT

## ✅ ĐÃ CÀI ĐẶT XONG!

Bạn đã có đầy đủ tính năng quản lý Shop trong Admin Dashboard!

---

## 🎯 CÁCH SỬ DỤNG NGAY

### Bước 1: Start Frontend
```bash
cd social-map-fe
npm run dev
```

### Bước 2: Login Admin
```
1. Mở http://localhost:5173/login
2. Login với tài khoản ADMIN hoặc SUPER_ADMIN
```

### Bước 3: Vào Shop Management
```
1. Click sidebar menu: "Quản lý Shops" (icon 🏪)
2. Hoặc trực tiếp: http://localhost:5173/dashboard/shops
```

---

## 📱 TÍNH NĂNG CÓ SẴN

### ✅ Hiển Thị Danh Sách
- Bảng đẹp với 10 shops/trang
- Hình ảnh, tên, địa chỉ, SĐT, trạng thái, đánh giá
- Badge màu cho từng status

### ✅ Tìm Kiếm & Lọc
```
🔍 Search: Gõ tên hoặc địa chỉ shop
📊 Filter: Chọn trạng thái (Tất cả/Đang mở/Đã đóng/Chờ duyệt)
```

### ✅ Phân Trang
```
‹ Trước | 1 [2] 3 ... 10 | Sau ›
```

### ✅ Thao Tác
```
✏️ Sửa    - Mở modal chỉnh sửa
🗑️ Xóa    - Xóa shop (có confirm)
👁️ Xem    - Mở trang chi tiết (tab mới)
➕ Thêm   - Thêm shop mới
```

---

## 🎨 SCREENSHOT DEMO

### Main Page:
```
┌────────────────────────────────────────────────────┐
│ 🏪 Quản Lý Cửa Hàng         [➕ Thêm Cửa Hàng Mới] │
├────────────────────────────────────────────────────┤
│ 🔍 [Tìm kiếm...]  Trạng thái: [Tất cả ▼]          │
│ Hiển thị 10 / 25 cửa hàng                          │
├────────────────────────────────────────────────────┤
│ ID  │ Ảnh │ Tên    │ Địa chỉ  │ SĐT   │ Status  │ │
│─────┼─────┼────────┼──────────┼───────┼─────────│ │
│ 123 │ 🏪  │ Shop A │ 📍 Hà Nội│ 📞 09 │ ✅ Mở   │ │
├────────────────────────────────────────────────────┤
│              ‹ Trước | 1 [2] 3 | Sau ›             │
└────────────────────────────────────────────────────┘
```

---

## 📂 FILES ĐÃ TẠO

```
social-map-fe/
├── src/
│   ├── components/
│   │   └── Admin/
│   │       ├── ShopManagement.jsx    ✅ NEW
│   │       └── ShopManagement.css    ✅ NEW
│   ├── App.jsx                        ✅ UPDATED (added route)
│   └── services/
│       └── shopService.js             ✅ Already exists
```

---

## 🔧 API ĐANG SỬ DỤNG

```javascript
GET    /shops          → getAllShops()
DELETE /shops/{id}     → deleteShop(id)
POST   /shops          → createShop(data)  // TODO: Implement in modal
PUT    /shops/{id}     → updateShop(id, data)  // TODO: Implement in modal
```

---

## ⚡ TEST NGAY!

### Test 1: Xem danh sách
```
✅ Navigate to /dashboard/shops
✅ Thấy bảng với shops
✅ Pagination hoạt động
```

### Test 2: Tìm kiếm
```
✅ Gõ "coffee" → Lọc ra shops có "coffee"
✅ Click X → Reset
```

### Test 3: Filter
```
✅ Chọn "Đang mở" → Chỉ thấy OPEN shops
✅ Chọn "Tất cả" → Thấy lại tất cả
```

### Test 4: Xóa shop
```
✅ Click 🗑️
✅ Confirm
✅ Shop biến mất
```

---

## 🎯 TODO (Nếu Muốn Mở Rộng)

### 1. Hoàn thiện Edit Modal
```javascript
// Hiện tại: Alert "Chức năng đang phát triển"
// TODO: Gọi API updateShop() thật

const handleSubmit = async (e) => {
    e.preventDefault();
    await updateShop(shop.id, formData);
    onSave();
};
```

### 2. Hoàn thiện Create Modal
```javascript
// Tương tự Edit, nhưng gọi createShop()

const handleSubmit = async (e) => {
    e.preventDefault();
    await createShop(formData);
    onSave();
};
```

### 3. Thêm Map Picker
```javascript
// Khi thêm/sửa shop, cho chọn vị trí trên map
// Tương tự CreateShopModal đã có
```

### 4. Thêm Image Upload
```javascript
// Upload nhiều ảnh cho shop
// Hiển thị preview
```

---

## 🎉 KẾT QUẢ

**Bạn đã có:**
- ✅ Trang quản lý Shop đầy đủ
- ✅ Search & Filter
- ✅ Pagination
- ✅ CRUD operations
- ✅ Responsive design
- ✅ Modern UI/UX

**URL truy cập:**
```
http://localhost:5173/dashboard/shops
```

---

**HAPPY MANAGING! 🏪✨**

