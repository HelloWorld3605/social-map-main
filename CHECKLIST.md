# ✅ CHECKLIST - KIỂM TRA MODAL STEP 2

## ✅ ĐÃ SỬA: CSS map preview quá lớn

### Thay đổi:
- ✅ Map `max-height`: 500px → **400px** (nhỏ hơn)
- ✅ Modal body `max-height`: calc(90vh - 250px) → **calc(90vh - 300px)** (dành nhiều chỗ hơn)
- ✅ Map instructions `padding`: 1.5rem → **1rem** (gọn hơn)
- ✅ Preview note `padding`: 0.75rem 1rem → **0.5rem 0.75rem** (compact hơn)

**→ Bây giờ modal sẽ hiển thị đầy đủ header, map, và footer!**

## 🚀 REFRESH VÀ TEST NGAY (Ctrl + Shift + R)

## Refresh trang và test theo checklist này:

### Bước 1: Mở modal
- [ ] Click "Tạo cửa hàng mới" 
- [ ] Modal hiển thị step 1

### Bước 2: Nhập thông tin
- [ ] Nhập tên: "Test Shop"
- [ ] Nhập địa chỉ: "Test Address"
- [ ] Nhập SĐT: "0123456789"

### Bước 3: Chuyển sang step 2
- [ ] Click "Tiếp theo →"
- [ ] Modal KHÔNG đóng
- [ ] Chuyển sang step 2

### Bước 4: Kiểm tra modal hiển thị ĐẦY ĐỦ
- [ ] ✅ HEADER: "📍 Chọn vị trí trên bản đồ" + nút [×]
- [ ] ✅ PROGRESS: (1) → (2) ✓ step 2 active
- [ ] ✅ INSTRUCTIONS: "📍 Click vào bản đồ..."
- [ ] ✅ PREVIEW NOTE: "⚠️ Đây là bản đồ xem trước..." (màu vàng)
- [ ] ✅ COORDINATES: "Vĩ độ: ... Kinh độ: ..."
- [ ] ✅ MAP: Bản đồ Mapbox với marker xanh lá
- [ ] ✅ FOOTER: "← Quay lại" + "✓ Xác nhận tạo shop"

**QUAN TRỌNG**: Tất cả 7 phần trên phải ở TRONG 1 modal!

### Bước 5: Test chức năng
- [ ] Kéo marker → Tọa độ cập nhật
- [ ] Click map → Marker di chuyển
- [ ] Click "← Quay lại" → Về step 1
- [ ] Lại "Tiếp theo" → Về step 2
- [ ] Click "✓ Xác nhận tạo shop"
- [ ] Modal đóng
- [ ] Alert hiển thị thành công
- [ ] Shop marker xuất hiện trên homepage map

## ✅ = TẤT CẢ HOẠT ĐỘNG ĐÚNG!

## ❌ Nếu thiếu bất kỳ phần nào:

1. Hard refresh: **Ctrl + Shift + R**
2. Clear cache
3. Test lại

Nếu vẫn lỗi → Gửi screenshot cho tôi!

