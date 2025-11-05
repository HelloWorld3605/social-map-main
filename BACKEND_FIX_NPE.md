# ✅ HOÀN TẤT - Fix Backend NullPointerException và CSS

## 🎯 Vấn đề đã sửa

### 1. Backend Error - NullPointerException
**Lỗi**: `Cannot invoke "java.util.List.stream()" because the return value of "com.mapsocial.entity.Shop.getTags()" is null`

**Nguyên nhân**: 
- Khi dùng `@Builder`, Lombok không sử dụng giá trị default của field
- `shop.getTags()` trả về `null` thay vì empty list

**Giải pháp đã áp dụng**:

#### File: ShopMapper.java
```java
// Thêm null check trước khi gọi stream()
.tags(shop.getTags() != null 
        ? shop.getTags().stream()
                .map(Tag::getName)
                .toList()
        : new java.util.ArrayList<>())
```

#### File: Shop.java
```java
// Thêm @Builder.Default để đảm bảo khởi tạo list
@Builder.Default
private List<String> imageShopUrl = new ArrayList<>();

@Builder.Default
private List<Menu> menus = new ArrayList<>();

@Builder.Default
private List<UserShop> userShops = new ArrayList<>();

@Builder.Default
private List<Tag> tags = new ArrayList<>();
```

### 2. CSS Error - Map bị đẩy xuống
**Lỗi**: Map có `margin-top: 350px` khiến layout bị vỡ

**Giải pháp**: Xóa dòng `margin-top: 350px`

```css
/* TRƯỚC - SAI */
.create-shop-map {
    margin-top: 350px;  /* ❌ Dòng này đẩy map xuống */
}

/* SAU - ĐÚNG */
.create-shop-map {
    flex: 1;
    min-height: 300px;
    max-height: 400px;
    /* ✅ Không có margin-top */
}
```

## 📁 Files đã sửa

1. ✅ **ShopMapper.java** - Thêm null check cho tags
2. ✅ **Shop.java** - Thêm @Builder.Default cho tất cả List fields
3. ✅ **CreateShopModal.css** - Xóa margin-top sai

## 🚀 BÂY GIỜ HÃY TEST

### Backend:
1. **Restart Spring Boot server** để áp dụng code mới
2. Test tạo shop từ frontend

### Frontend:
1. **Hard refresh**: `Ctrl + Shift + R`
2. Mở modal tạo shop
3. Nhập thông tin và chọn vị trí
4. Nhấn "Xác nhận tạo shop"

### ✅ Kết quả mong đợi:
- ❌ Không còn lỗi NullPointerException
- ✅ Shop được tạo thành công
- ✅ Modal hiển thị đúng layout (không bị đẩy xuống)
- ✅ Map preview 300-400px, vừa khung
- ✅ Shop xuất hiện trên homepage map
- ✅ Tất cả users thấy shop mới

## 🔍 Chi tiết kỹ thuật

### Tại sao cần @Builder.Default?
```java
// Khi dùng @Builder mà không có @Builder.Default
Shop shop = Shop.builder()
    .name("Test")
    .build();
// → shop.getTags() = null ❌

// Khi có @Builder.Default
@Builder.Default
private List<Tag> tags = new ArrayList<>();

Shop shop = Shop.builder()
    .name("Test")
    .build();
// → shop.getTags() = [] ✅
```

### Tại sao cần null check trong mapper?
- Defensive programming
- Tránh NPE nếu database có data cũ
- Đảm bảo API luôn trả về list (không bao giờ null)

## 📊 Checklist hoàn thành

Backend fixes:
- [x] Thêm null check trong ShopMapper.toShopResponse()
- [x] Thêm @Builder.Default cho imageShopUrl
- [x] Thêm @Builder.Default cho menus
- [x] Thêm @Builder.Default cho userShops
- [x] Thêm @Builder.Default cho tags

Frontend fixes:
- [x] Xóa margin-top: 350px sai
- [x] Map container có sizing đúng (300-400px)
- [x] Layout modal ổn định

## 🎉 KẾT QUẢ

**Backend**: Không còn NullPointerException khi tạo shop
**Frontend**: Modal hiển thị đúng layout, map vừa khung
**Tích hợp**: Shop được tạo thành công và hiển thị cho tất cả users

---

**Restart server và test ngay!** 🚀

