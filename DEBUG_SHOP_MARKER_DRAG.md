# 🐛 DEBUG - Shop Marker Không Kéo Được

## ✅ Đã sửa các vấn đề:

### 1. Xóa HTML5 draggable attribute
**Vấn đề**: Shop marker có `draggable="true"` (HTML5 drag) conflict với LocationSharing (mousedown events)
```javascript
// TRƯỚC (SAI):
el.setAttribute('draggable', 'true');

// SAU (ĐÚNG):
// REMOVED - Let LocationSharing handle drag
```

### 2. Disable setupShopDragAndDrop
**Vấn đề**: shopMarkersManager đang tự xử lý drag events, conflict với LocationSharing
```javascript
// TRƯỚC:
this.setupShopDragAndDrop(el, shop, marker);

// SAU:
// DISABLED: Let LocationSharing handle drag & drop functionality
// this.setupShopDragAndDrop(el, shop, marker);
```

### 3. Re-attach LocationSharing events sau khi load shops
**Vấn đề**: Shop markers được add sau khi LocationSharing init, nên không có events
```javascript
async loadShops() {
    //...existing code...
    this.addShopMarkers(shops);
    
    // Re-attach LocationSharing events after shops are added
    if (window.locationSharing) {
        setTimeout(() => {
            window.locationSharing.attachMarkerEventsOnce();
        }, 500);
    }
}
```

### 4. Thêm detailed logging
**Để debug**: Console sẽ hiển thị chi tiết từng marker
```javascript
console.log(`[LocationSharing] Checking marker ${index}:`, {
    classes: markerEl.className,
    shopCreation: markerEl.dataset.shopCreation,
    shopId: markerEl.getAttribute('data-shop-id'),
    shopName: markerEl.getAttribute('data-shop-name')
});
```

## 🧪 CÁCH TEST:

### 1. Hard Refresh
```
Ctrl + Shift + R
```

### 2. Mở Console (F12)
Kiểm tra logs:
```
[LocationSharing] Checking marker 0: ...
[LocationSharing] ✅ Attached drag to SHOP marker: Test Shop
[LocationSharing] Summary: Total=2, Shop=1, Regular=1, Skipped=0
```

### 3. Kiểm tra shop marker trên map
- Tìm icon 🏪
- Hover vào → Cursor phải là "grab" (tay nắm)
- Click và giữ → Cursor phải thành "grabbing"

### 4. Kéo shop marker
1. Click và GIỮ shop marker
2. Kéo vào khung chat bạn bè
3. Chat window phải highlight (có viền)
4. Thả chuột
5. Tin nhắn xuất hiện với thông tin shop

## 🔍 KIỂM TRA NẾU VẪN LỖI:

### A. Kiểm tra Console Logs

#### ✅ ĐÚNG - Shop marker được attach:
```
[LocationSharing] Checking marker 0: {
    classes: "mapboxgl-marker shop-marker",
    shopCreation: null,
    shopId: "uuid-123",
    shopName: "Test Shop"
}
[LocationSharing] ✅ Attached drag to SHOP marker: Test Shop
[LocationSharing] Summary: Total=2, Shop=1, Regular=1, Skipped=0
```

#### ❌ SAI - Shop marker bị skip:
```
[LocationSharing] Skipping create-shop marker (modal)
[LocationSharing] Summary: Total=2, Shop=0, Regular=1, Skipped=1
```

### B. Kiểm tra Shop Marker Element

#### Mở DevTools → Elements → Tìm shop marker:
```html
<!-- ✅ ĐÚNG -->
<div class="mapboxgl-marker shop-marker" 
     data-shop-id="uuid-123"
     data-shop-name="Test Shop"
     data-has-listener="true"
     data-marker-id="marker-0"
     style="cursor: grab; pointer-events: auto;">
    <div class="shop-marker-icon">🏪</div>
</div>

<!-- ❌ SAI - Thiếu data-has-listener -->
<div class="mapboxgl-marker shop-marker" 
     data-shop-id="uuid-123"
     data-shop-name="Test Shop">
    <!-- LocationSharing chưa attach events -->
</div>

<!-- ❌ SAI - Có draggable="true" -->
<div class="mapboxgl-marker shop-marker" 
     draggable="true">
    <!-- HTML5 drag conflict -->
</div>
```

### C. Kiểm tra Window Objects

#### Mở Console → Gõ:
```javascript
// Kiểm tra LocationSharing
window.locationSharing
// ✅ Phải có object, không phải undefined

// Kiểm tra Shop Markers Manager
window.shopMarkersManager
// ✅ Phải có object

// Kiểm tra shops array
window.shopMarkersManager.shops
// ✅ Phải có array với shop data

// Kiểm tra shop markers
document.querySelectorAll('.shop-marker')
// ✅ Phải có NodeList với shop markers
```

### D. Test từng bước:

#### Test 1: Marker có class đúng không?
```javascript
const shopMarker = document.querySelector('.shop-marker');
console.log(shopMarker.className);
// Expected: "mapboxgl-marker shop-marker"
// NOT: "mapboxgl-marker shop-marker create-shop-marker"
```

#### Test 2: Marker có events không?
```javascript
const shopMarker = document.querySelector('.shop-marker');
console.log(shopMarker.dataset.hasListener);
// Expected: "true"
```

#### Test 3: Marker có cursor grab không?
```javascript
const shopMarker = document.querySelector('.shop-marker');
console.log(window.getComputedStyle(shopMarker).cursor);
// Expected: "grab"
```

#### Test 4: Trigger mousedown manually
```javascript
const shopMarker = document.querySelector('.shop-marker');
const event = new MouseEvent('mousedown', {
    bubbles: true,
    cancelable: true,
    clientX: 100,
    clientY: 100
});
shopMarker.dispatchEvent(event);
// Check console for: "startDrag: called for marker"
```

## 🔧 CÁCH SỬA NẾU VẪN LỖI:

### Lỗi 1: Shop marker không có data-has-listener

**Nguyên nhân**: LocationSharing chạy trước khi shops được load

**Fix**: 
```javascript
// Sau khi shops load, gọi:
window.locationSharing.attachMarkerEventsOnce();
```

### Lỗi 2: Cursor không đổi thành "grab"

**Nguyên nhân**: CSS hoặc pointer-events bị override

**Fix**:
```css
.shop-marker {
    cursor: grab !important;
    pointer-events: auto !important;
}
```

### Lỗi 3: Marker có class "create-shop-marker"

**Nguyên nhân**: Class name conflict

**Fix**: 
```javascript
// Trong shopMarkersManager.js
el.className = 'shop-marker'; // ONLY this class
```

### Lỗi 4: Drag không trigger

**Nguyên nhân**: HTML5 draggable conflict

**Fix**:
```javascript
// Remove draggable attribute completely
// el.setAttribute('draggable', 'true'); // DELETE THIS LINE
```

## 📝 Checklist Debug:

- [ ] Hard refresh (Ctrl + Shift + R)
- [ ] Check console có logs LocationSharing không
- [ ] Check console có "✅ Attached drag to SHOP marker" không
- [ ] Check shop marker có data-has-listener="true" không
- [ ] Check shop marker có cursor: grab không
- [ ] Check shop marker KHÔNG có draggable="true" không
- [ ] Check shop marker KHÔNG có class "create-shop-marker" không
- [ ] Check window.locationSharing tồn tại không
- [ ] Check window.shopMarkersManager.shops có data không
- [ ] Try kéo shop marker → Check console có logs không

## 📸 Nếu vẫn lỗi, gửi:

1. **Screenshot Console** - Tất cả logs từ khi refresh
2. **Screenshot Elements** - Shop marker element HTML
3. **Screenshot Console Commands** - Kết quả các lệnh kiểm tra trên
4. **Mô tả**: Marker nào kéo được? Marker nào không kéo được?

---

**REFRESH VÀ KIỂM TRA CONSOLE LOGS NGAY!** 🔍

