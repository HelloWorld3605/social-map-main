# 🧪 HƯỚNG DẪN TEST - MODAL STEP 2

## ✅ ĐÃ SỬA: Modal hiển thị đầy đủ

### Vấn đề trước đó:
- ❌ Chỉ thấy map preview
- ❌ KHÔNG thấy header, footer, buttons
- ❌ Map chiếm toàn màn hình

### Đã sửa:
- ✅ **Modal container**: Thêm `height: 90vh` để giới hạn chiều cao
- ✅ **Modal body**: Thêm `max-height: calc(90vh - 250px)` để dành chỗ cho header/footer
- ✅ **Map container**: Giới hạn `max-height: 500px` để không chiếm quá nhiều không gian
- ✅ **Bỏ inline styles** làm rối layout

### Bây giờ modal SẼ hiển thị:
```
┌─────────────────────────────────────────┐
│  📍 Chọn vị trí trên bản đồ        [×] │ ← ✅ Header hiển thị
├─────────────────────────────────────────┤
│  (1) Thông tin ──── (2) Vị trí          │ ← ✅ Progress steps
├─────────────────────────────────────────┤
│  📍 Click vào bản đồ...                 │
│  ⚠️ Đây là bản đồ xem trước...          │ ← ✅ Instructions
│  Vĩ độ: 20.905867 Kinh độ: 105.489226  │ ← ✅ Coordinates
│  ┌─────────────────────────────────┐   │
│  │     [BẢN ĐỒ với marker]        │   │ ← ✅ Map (max 500px)
│  └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│  [← Quay lại] [✓ Xác nhận tạo shop]    │ ← ✅ Footer hiển thị
└─────────────────────────────────────────┘
```

## 🔍 KIỂM TRA NGAY

### Refresh lại trang và test:
1. Mở modal tạo shop
2. Nhập thông tin
3. Nhấn "Tiếp theo →"
4. **KIỂM TRA**:

#### ✅ ĐÚNG - Nếu thấy:
```
┌─────────────────────────────────────────┐
│  📍 Chọn vị trí trên bản đồ        [×] │ ← Header
├─────────────────────────────────────────┤
│  (1) Thông tin ──── (2) Vị trí          │ ← Progress steps (step 2 active)
├─────────────────────────────────────────┤
│                                         │
│  📍 Click vào bản đồ hoặc kéo marker... │
│                                         │
│  ⚠️ Đây là bản đồ xem trước...          │ ← Preview note (vàng)
│                                         │
│  Vĩ độ: 21.028500 Kinh độ: 105.854200  │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  │        [BẢN ĐỒ PREVIEW]        │   │ ← Mapbox map
│  │         với marker xanh         │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
├─────────────────────────────────────────┤
│        [← Quay lại] [✓ Xác nhận tạo shop] │ ← Footer buttons
└─────────────────────────────────────────┘
```

**Modal NÀY phải hiển thị CHÍNH GIỮA màn hình**
- Background đen mờ phía sau
- Modal màu trắng, có shadow
- Bản đồ hiển thị TRONG modal

#### ❌ SAI - Nếu thấy:
- Homepage map với marker shop
- Marker Hà Nội biến mất
- KHÔNG thấy modal overlay (nền đen mờ)
- KHÔNG thấy nút "✓ Xác nhận tạo shop"

## 🔍 KIỂM TRA BẰNG CONSOLE

### Console logs mong đợi:

```
🔄 Moving to step 2...
✅ Moved to step 2 - Map preview
📍 Step changed to: 2
🏪 CreateShopModal RENDERING - step: 2, isOpen: true
🏪 FormData: {name: 'Makeup Văn Phòng', address: 'thái hòa'}
🗺️ Rendering Step 2 - Map Preview
⏭️ Skipping map init - isOpen: true, step: 1
🗺️ Starting map initialization...
✅ Map container found: <div id="create-shop-map" ...>
📏 Container dimensions: 736 x 400  (hoặc số khác > 0)
🗺️ Initializing Mapbox...
✅ Map instance created
✅ Map loaded successfully!
✅ Marker added to map
```

### ❌ Nếu thấy lỗi:
```
❌ Map container not found!
🔍 Searching for container with id: create-shop-map
```
→ Có vấn đề với DOM rendering

## 🔍 KIỂM TRA BẰNG DEVTOOLS

### Bước 1: Kiểm tra Elements
1. Mở DevTools (F12)
2. Tab **Elements**
3. Tìm kiếm: `.create-shop-modal-overlay`

#### ✅ Phải thấy:
```html
<div class="create-shop-modal-overlay" style="...">
  <div class="create-shop-modal">
    <div class="modal-header">...</div>
    <div class="progress-steps">...</div>
    <div class="modal-body map-step" style="background-color: white; min-height: 500px;">
      <div class="map-instructions">...</div>
      <div id="create-shop-map" class="create-shop-map" style="...">
        <!-- Mapbox canvas here -->
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-back">← Quay lại</button>
      <button class="btn-submit">✓ Xác nhận tạo shop</button>
    </div>
  </div>
</div>
```

### Bước 2: Kiểm tra Computed Styles
Chọn `.create-shop-modal-overlay` và xem Computed:
- ✅ `position`: fixed
- ✅ `z-index`: 10000
- ✅ `display`: flex
- ✅ `top`: 0px
- ✅ `left`: 0px
- ✅ `right`: 0px
- ✅ `bottom`: 0px

## 🐛 TROUBLESHOOTING

### Vấn đề 1: Modal không hiển thị, chỉ thấy homepage map

**Nguyên nhân có thể**:
- Modal bị z-index thấp hơn homepage map
- Modal bị position: absolute thay vì fixed
- Modal bị transform đẩy ra ngoài viewport

**Giải pháp**:
1. Kiểm tra CSS `.create-shop-modal-overlay`
2. Đảm bảo `z-index: 10000 !important`
3. Kiểm tra không có CSS nào override

### Vấn đề 2: Modal hiển thị nhưng map không load

**Triệu chứng**:
- Thấy modal
- Thấy preview note (vàng)
- Nhưng map container trống hoặc lỗi 403

**Giải pháp**:
- ✅ Token đã được cập nhật
- Kiểm tra console có lỗi Mapbox không
- Kiểm tra `create-shop-map` container có chiều cao không

### Vấn đề 3: Map hiển thị ở homepage thay vì trong modal

**Nguyên nhân**:
- Mapbox khởi tạo vào sai container
- Homepage map container có cùng ID

**Giải pháp**:
1. Kiểm tra có 2 elements với id `create-shop-map` không
2. Đảm bảo modal render TRƯỚC khi init map
3. Check logging: "✅ Map container found: ..."

## 📸 GỬI THÔNG TIN NẾU VẪN LỖI

Nếu vẫn gặp vấn đề, gửi:

### 1. Screenshot màn hình
- Chụp toàn bộ màn hình sau khi nhấn "Tiếp theo"
- Có thấy modal không?
- Map ở đâu?

### 2. Screenshot Console
- Chụp TẤT CẢ logs từ khi nhấn "Tiếp theo"
- Từ log `🔄 Moving to step 2...` đến khi map load

### 3. Screenshot Elements tab
- Tìm `.create-shop-modal-overlay`
- Chụp cấu trúc HTML
- Chụp Computed styles (z-index, position, display)

### 4. Thông tin:
- Trình duyệt: Chrome/Edge/Firefox?
- Phiên bản: ?
- Màn hình: độ phân giải?

## ✅ KẾT QUẢ MONG ĐỢI

Sau khi nhấn "Tiếp theo":
1. ✅ Modal vẫn hiển thị (KHÔNG đóng)
2. ✅ Modal ở GIỮA màn hình với background đen mờ
3. ✅ Header đổi thành "📍 Chọn vị trí trên bản đồ"
4. ✅ Progress bar hiển thị step 2 active
5. ✅ Thấy preview note màu vàng
6. ✅ Bản đồ hiển thị TRONG modal (không phải homepage)
7. ✅ Marker màu xanh lá có thể kéo thả
8. ✅ Tọa độ cập nhật real-time
9. ✅ Có 2 nút: "← Quay lại" và "✓ Xác nhận tạo shop"

Khi nhấn "✓ Xác nhận tạo shop":
1. ✅ Shop được tạo
2. ✅ Marker xuất hiện trên homepage map
3. ✅ Tất cả users thấy shop mới

