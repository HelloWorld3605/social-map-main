# Debug: Tạo Shop Modal

## Vấn đề hiện tại
Khi nhấn "Tiếp theo" ở bước 1, modal bị đóng và map hiển thị ở homepage thay vì trong modal.

## Console Logs cần kiểm tra

### Khi mở modal lần đầu:
```
🏪 Opening CreateShopModal from Sidebar
🏪 CreateShopModal isOpen changed: true
📍 Step changed to: 1
🏪 CreateShopModal RENDERING - step: 1, isOpen: true
🏪 FormData: { name: '', address: '' }
```

### Khi nhập thông tin:
```
🏪 FormData: { name: 'Tên shop test', address: 'Địa chỉ test' }
```

### Khi nhấn "Tiếp theo":
```
🔄 Moving to step 2...
✅ Moved to step 2 - Map preview
📍 Step changed to: 2
🏪 CreateShopModal RENDERING - step: 2, isOpen: true
🗺️ Rendering Step 2 - Map Preview
Initializing create shop map...
Map loaded, adding marker...
```

### ❌ Nếu thấy log này = Modal BỊ ĐÓNG:
```
🚪 Sidebar closing CreateShopModal
🏪 CreateShopModal isOpen changed: false
🏪 CreateShopModal not rendering (isOpen = false)
```

## Các trường hợp có thể xảy ra

### Trường hợp 1: Modal bị đóng không mong muốn
**Triệu chứng**: Thấy log "Sidebar closing CreateShopModal" sau khi nhấn "Tiếp theo"

**Nguyên nhân**: 
- Event propagation bubble up đến overlay
- Có code nào đó gọi onClose()

**Giải pháp**: Đã thêm e.stopPropagation() trong handleNextStep

### Trường hợp 2: Step 2 không render
**Triệu chứng**: KHÔNG thấy log "🗺️ Rendering Step 2 - Map Preview"

**Nguyên nhân**: 
- Conditional rendering `{step === 2 && ...}` không hoạt động
- State step không được update

**Kiểm tra**: Xem log "📍 Step changed to: 2" có xuất hiện không

### Trường hợp 3: Map container không tồn tại
**Triệu chứng**: Thấy log "Map container not found"

**Nguyên nhân**: 
- Element #create-shop-map chưa được render
- useEffect chạy trước khi DOM ready

**Giải pháp**: useEffect đã có dependency [isOpen, step]

### Trường hợp 4: Modal render nhưng bị ẩn
**Triệu chứng**: 
- Thấy log render step 2
- Nhưng không thấy modal trên màn hình
- Homepage map hiển thị

**Nguyên nhân**: CSS z-index hoặc display issue

**Kiểm tra**:
1. Mở DevTools
2. Tìm element `.create-shop-modal-overlay`
3. Kiểm tra:
   - display: flex ✓
   - z-index: 10000 ✓
   - opacity: 1 ✓
   - visibility: visible ✓

## Cách debug

### Bước 1: Mở Console
1. Nhấn F12 để mở DevTools
2. Chuyển sang tab Console
3. Xóa hết logs cũ (Clear console)

### Bước 2: Mở Modal
1. Click "Tạo cửa hàng mới"
2. Xem console logs
3. Ghi lại những gì xuất hiện

### Bước 3: Nhập thông tin
1. Nhập tên shop: "Test Shop"
2. Nhập địa chỉ: "Test Address"
3. Nhập số điện thoại: "0123456789"

### Bước 4: Nhấn "Tiếp theo"
1. Click nút "Tiếp theo →"
2. **QUAN TRỌNG**: Xem console ngay lập tức
3. Ghi lại TẤT CẢ logs xuất hiện

### Bước 5: Kiểm tra DOM
1. Nếu modal biến mất, mở Elements tab
2. Tìm kiếm "create-shop-modal-overlay"
3. Xem element có tồn tại không

## Kết quả mong đợi

### ✅ Đúng:
```
🔄 Moving to step 2...
✅ Moved to step 2 - Map preview
📍 Step changed to: 2
🏪 CreateShopModal RENDERING - step: 2, isOpen: true
🗺️ Rendering Step 2 - Map Preview
Initializing create shop map...
Map loaded, adding marker...
```
→ Modal vẫn mở, hiển thị map preview với marker màu xanh lá

### ❌ Sai:
```
🔄 Moving to step 2...
🚪 Sidebar closing CreateShopModal
🏪 CreateShopModal isOpen changed: false
```
→ Modal bị đóng = Có vấn đề với event handling

## Hành động tiếp theo

### Nếu thấy modal bị đóng:
1. Kiểm tra có click nhầm vào overlay không
2. Kiểm tra có event listener nào khác trigger close
3. Thêm breakpoint trong handleModalClose và handleOverlayClick

### Nếu step 2 không render:
1. Kiểm tra state `step` trong React DevTools
2. Xem `setStep(2)` có được gọi không
3. Kiểm tra conditional rendering

### Nếu modal render nhưng không thấy:
1. Kiểm tra CSS z-index
2. Kiểm tra có element nào che modal không
3. Kiểm tra position: fixed có hoạt động không

## Thông tin hỗ trợ

### Modal CSS Styles:
```css
.create-shop-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 10000; /* Rất cao */
    display: flex;
    align-items: center;
    justify-content: center;
}
```

### Map Container:
```html
<div id="create-shop-map" class="create-shop-map"></div>
```

### useEffect Dependencies:
```javascript
useEffect(() => {
    if (!isOpen || step !== 2) return;
    // Initialize map...
}, [isOpen, step]);
```

## Gửi thông tin debug

Khi báo lỗi, vui lòng gửi:
1. ✅ Screenshot console logs
2. ✅ Screenshot màn hình (modal có hiển thị không)
3. ✅ Các bước đã thực hiện
4. ✅ Trình duyệt đang dùng (Chrome, Firefox, Edge...)

