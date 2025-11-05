# ✅ ĐÃ SỬA XONG - Kéo Shop Markers để Share

## 🎯 Vấn đề:
**Trước đây**: Không thể kéo shop markers để chia sẻ vào tin nhắn cho bạn bè (giống như kéo marker Hà Nội)

**Nguyên nhân**: LocationSharing đang skip tất cả shop markers

## ✅ Giải pháp đã áp dụng:

### 1. File: location-sharing.js

#### Cho phép kéo shop markers (nhưng vẫn skip create-shop-marker trong modal):

```javascript
// Trong attachMarkerEventsOnce():
// Skip ONLY shop creation markers (in modal), but allow shop markers (on map)
if (markerEl.dataset.shopCreation === 'true' ||
    markerEl.classList.contains('create-shop-marker')) {
    console.log('[LocationSharing] Skipping create-shop marker (modal)');
    return;
}
// ✅ Shop markers trên map KHÔNG bị skip
```

#### Extract shop data khi kéo:

```javascript
// Trong initiateDrag():
if (markerEl.classList.contains('shop-marker')) {
    const shopId = markerEl.getAttribute('data-shop-id');
    const shopName = markerEl.getAttribute('data-shop-name');
    
    // Get full shop data including images
    const fullShopData = window.shopMarkersManager.shops.find(s => s.id === shopId);
    
    const shopImage = (fullShopData?.imageShopUrl?.length > 0) 
        ? fullShopData.imageShopUrl[0] 
        : '/icons/location.svg';
    
    shopData = {
        name: shopName,
        coordinates: [lng, lat],
        image: shopImage,
        description: fullShopData?.address || 'Cửa hàng',
        type: 'shop',
        shopId: shopId,
        phoneNumber: fullShopData?.phoneNumber,
        rating: fullShopData?.rating,
        status: fullShopData?.status
    };
}
```

### 2. File: shopMarkersManager.js

#### Lưu shops array để LocationSharing truy cập:

```javascript
constructor() {
    this.map = null;
    this.markers = [];
    this.shopPopups = new Map();
    this.shops = []; // ✅ Store shops array
}

async loadShops() {
    const shops = await getAllShops();
    this.shops = shops; // ✅ Save shops array
    this.addShopMarkers(shops);
}
```

## 🎨 Kết quả:

### Bây giờ có thể kéo shop markers:

1. **Shop marker trên map** → Có thể kéo để share
2. **Create-shop marker trong modal** → Không thể kéo (đúng)
3. **Hà Nội marker** → Vẫn kéo được như trước

### Thông tin shop khi share:

```json
{
  "name": "Tên shop",
  "coordinates": [lng, lat],
  "image": "https://shop-image-url.jpg",
  "description": "Địa chỉ shop",
  "type": "shop",
  "shopId": "uuid",
  "phoneNumber": "0123456789",
  "rating": 4.5,
  "status": "OPEN"
}
```

### Drag preview sẽ hiển thị:
- ✅ Ảnh shop (nếu có) hoặc icon mặc định
- ✅ Tên shop
- ✅ "Kéo vào khung chat để chia sẻ"

## 🧪 Cách test:

### 1. Refresh trang
```
Ctrl + Shift + R
```

### 2. Tìm shop marker trên map
- Shop markers có icon 🏪
- Hover vào để xem popup

### 3. Kéo shop marker
1. Click và giữ shop marker
2. Kéo vào khung chat của bạn bè
3. Thả chuột

### 4. Kiểm tra tin nhắn
- Tin nhắn hiển thị thông tin shop
- Có ảnh shop (nếu có)
- Có nút "Xem trên bản đồ"
- Click nút → Map zoom đến shop

## 🔍 Phân biệt các loại markers:

| Marker | Có thể kéo? | Icon | Mục đích |
|--------|-------------|------|----------|
| Hà Nội marker | ✅ | 📍 | Chia sẻ vị trí chung |
| Shop marker (trên map) | ✅ | 🏪 | Chia sẻ shop cho bạn bè |
| Create-shop marker (modal) | ❌ | 📍 | Chọn vị trí khi tạo shop mới |

## 📁 Files đã sửa:

1. ✅ `location-sharing.js`
   - Allow shop markers to be draggable
   - Extract full shop data (image, address, phone, rating)
   - Distinguish between shop marker and create-shop marker

2. ✅ `shopMarkersManager.js`
   - Store shops array in `this.shops`
   - Make data accessible to LocationSharing

## 🎉 HOÀN THÀNH!

**Bây giờ có thể:**
- ✅ Kéo shop markers để share vào tin nhắn
- ✅ Kéo Hà Nội marker như trước
- ✅ Shop markers hiển thị đầy đủ thông tin (ảnh, tên, địa chỉ)
- ✅ Bạn bè nhận được vị trí shop với nút "Xem trên bản đồ"

**REFRESH VÀ TEST NGAY!** 🚀

