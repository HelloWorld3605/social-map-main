# Luồng tạo Shop với Preview Map

## Tóm tắt thay đổi

Đã cập nhật tính năng tạo shop để người dùng chọn vị trí trên **bản đồ preview** ở bước 2, sau đó khi nhấn **"Xác nhận tạo shop"**, vị trí sẽ được pin lên bản đồ thật và **tất cả user sẽ thấy**.

## Các thay đổi đã thực hiện

### 1. CreateShopModal.jsx
- **Bước 2 - Map Preview**: Thêm thông báo rõ ràng cho người dùng biết đây là bản đồ xem trước
  ```
  ⚠️ Đây là bản đồ xem trước. Vị trí sẽ được pin lên bản đồ thật sau khi bạn nhấn "Xác nhận tạo shop"
  ```
- **Nút xác nhận**: Đổi text từ "✓ Tạo cửa hàng" → "✓ Xác nhận tạo shop" để rõ ràng hơn
- **Bug fixes**:
  - Thêm `e.preventDefault()` và `e.stopPropagation()` trong `handleNextStep` để ngăn modal đóng không mong muốn
  - Thêm xác nhận trước khi đóng modal khi đã nhập dữ liệu
  - Thêm logging để debug dễ dàng hơn
  - Tách `handleModalClose` và `handleOverlayClick` để xử lý đóng modal an toàn hơn

### 2. CreateShopModal.css
- Thêm style cho `.preview-note` để làm nổi bật thông báo:
  - Background: Gradient vàng nhẹ
  - Border: Màu vàng nổi bật
  - Icon: ⚠️ để thu hút sự chú ý

### 3. Sidebar.jsx
- **Cải thiện callback `onShopCreated`**:
  - Thay vì reload toàn bộ trang (`window.location.reload()`)
  - Sử dụng `window.shopMarkersManager.loadShops()` để chỉ reload markers
  - Hiệu quả hơn, không làm gián đoạn trải nghiệm người dùng
  - Alert message: "Cửa hàng đã được tạo thành công! Vị trí đã được pin lên bản đồ."

## Luồng hoạt động

### Bước 1: Nhập thông tin shop
- Tên cửa hàng (*)
- Địa chỉ (*)
- Số điện thoại (*)
- Mô tả
- Giờ hoạt động
- Hình ảnh (tối đa 10 ảnh)
- **Nhấn "Tiếp theo →"** để chuyển sang bước 2
  - Modal sẽ **KHÔNG đóng**
  - Chuyển sang step 2 để chọn vị trí

### Bước 2: Chọn vị trí trên Preview Map
- Hiển thị bản đồ xem trước (preview)
- User có thể:
  - Click vào bản đồ để đặt marker
  - Kéo marker để di chuyển vị trí
- Hiển thị tọa độ (vĩ độ, kinh độ) real-time
- **Lưu ý**: Đây là preview, chưa pin lên map thật
- **Có thể "← Quay lại"** để sửa thông tin ở bước 1

### Bước 3: Xác nhận tạo shop
- Nhấn **"✓ Xác nhận tạo shop"**
- Shop được tạo trên server
- **Shop marker được tự động pin lên bản đồ thật**
- **Tất cả users khác sẽ thấy shop mới này**
- Modal đóng lại
- Hiển thị thông báo thành công

## Cơ chế đồng bộ với tất cả users

### 1. Khi shop được tạo thành công:
```javascript
if (window.shopMarkersManager) {
    window.shopMarkersManager.loadShops(); // Reload tất cả shop markers
}
```

### 2. ShopMarkersManager tự động:
- Gọi API `getAllShops()` để lấy danh sách shops (bao gồm shop mới)
- Xóa các markers cũ
- Thêm tất cả markers mới (bao gồm shop vừa tạo)
- Hiển thị trên bản đồ chính

### 3. Các users khác:
- Khi họ refresh trang hoặc load map
- ShopMarkersManager sẽ tự động load tất cả shops từ server
- Shop mới sẽ hiển thị cho mọi người

## Điểm khác biệt giữa Preview Map và Main Map

| Tính năng | Preview Map (Bước 2) | Main Map |
|-----------|---------------------|----------|
| Mục đích | Xem trước và chọn vị trí | Hiển thị tất cả shops |
| Marker | 1 marker có thể di chuyển | Nhiều markers (tất cả shops) |
| Người thấy | Chỉ người đang tạo | Tất cả users |
| Thời điểm | Trong modal tạo shop | Sau khi tạo thành công |
| Tương tác | Có thể kéo, click để chọn | Có thể click để xem thông tin |

## Kết quả

✅ User chọn vị trí trên bản đồ preview ở bước 2
✅ Sau khi nhấn "Xác nhận tạo shop", shop được tạo
✅ Shop marker tự động xuất hiện trên bản đồ thật
✅ Tất cả users đều thấy shop mới (khi reload hoặc khi shopMarkersManager load)
✅ Trải nghiệm mượt mà, không cần reload toàn bộ trang

## Xử lý sự cố đã sửa

### ❌ Vấn đề: Modal đóng khi nhấn "Tiếp theo" ở bước 1

**Nguyên nhân**: 
- Event propagation không được xử lý đúng
- Có thể có event listener nào đó trigger close

**Giải pháp đã áp dụng**:
1. Thêm `e.preventDefault()` và `e.stopPropagation()` trong `handleNextStep`
2. Tách riêng handler cho overlay click và close button
3. Thêm confirmation dialog khi đóng modal nếu đã nhập dữ liệu
4. Thêm logging để debug:
   ```
   🔄 Moving to step 2...
   ✅ Moved to step 2 - Map preview
   ```

### ✅ Kết quả sau khi sửa:
- Modal **không còn đóng** khi nhấn "Tiếp theo"
- Step chuyển mượt mà từ 1 → 2
- Map preview hiển thị đúng
- Có thể quay lại step 1 để chỉnh sửa
- Có xác nhận trước khi đóng modal (tránh mất dữ liệu)

## Debug và Testing

### Console logs khi sử dụng:
```
🏪 CreateShopModal rendering, step: 1, isOpen: true
🔄 Moving to step 2...
✅ Moved to step 2 - Map preview
🏪 CreateShopModal rendering, step: 2, isOpen: true
Initializing create shop map...
Map loaded, adding marker...
```

### Kiểm tra:
1. ✅ Nhấn "Tiếp theo" → Modal không đóng, chuyển sang step 2
2. ✅ Map preview hiển thị với 1 marker màu xanh lá
3. ✅ Click hoặc kéo marker → Tọa độ cập nhật real-time
4. ✅ Nhấn "← Quay lại" → Quay về step 1, dữ liệu giữ nguyên
5. ✅ Nhấn "✓ Xác nhận tạo shop" → Shop được tạo và pin lên map thật
6. ✅ Shop markers reload tự động, không cần refresh trang


