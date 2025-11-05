# ✅ Tính năng Upload Hình Ảnh cho Tạo Cửa Hàng

## 📋 Tóm tắt
Đã thay thế phần nhập URL hình ảnh bằng **upload file trực tiếp** trong form tạo cửa hàng mới.

## 🔄 Các thay đổi đã thực hiện

### 1. **CreateShopModal.jsx** - Component chính

#### Import thêm UploadService:
```jsx
import { UploadService } from '../../services/UploadService';
```

#### State mới:
```jsx
const [uploadingImage, setUploadingImage] = useState(false);
// Đã xóa: const [imageInput, setImageInput] = useState('');
```

#### Hàm upload mới (thay thế handleAddImage):
```jsx
const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    // Check limit
    if (formData.imageShopUrl.length + files.length > 10) {
        setError(`Chỉ có thể tải lên tối đa 10 ảnh. Hiện tại: ${formData.imageShopUrl.length}/10`);
        return;
    }

    setUploadingImage(true);
    setError('');

    try {
        const uploadPromises = files.map(file => {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                throw new Error(`File ${file.name} không phải là hình ảnh`);
            }
            
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                throw new Error(`File ${file.name} quá lớn. Tối đa 5MB`);
            }
            
            return UploadService.uploadFile(file);
        });

        const uploadedUrls = await Promise.all(uploadPromises);
        
        setFormData(prev => ({
            ...prev,
            imageShopUrl: [...prev.imageShopUrl, ...uploadedUrls]
        }));

        // Reset file input
        e.target.value = '';
    } catch (err) {
        console.error('Upload failed:', err);
        setError(err.message || 'Không thể tải ảnh lên. Vui lòng thử lại.');
    } finally {
        setUploadingImage(false);
    }
};
```

#### UI mới (thay thế input URL):
```jsx
<div className="image-upload-group">
    <label htmlFor="shop-images" className="btn-upload-image">
        {uploadingImage ? (
            <>
                <span className="upload-spinner"></span>
                <span>Đang tải lên...</span>
            </>
        ) : (
            <>
                <span>📤</span>
                <span>Chọn ảnh để tải lên</span>
            </>
        )}
    </label>
    <input
        type="file"
        id="shop-images"
        accept="image/*"
        multiple
        onChange={handleImageUpload}
        disabled={uploadingImage || formData.imageShopUrl.length >= 10}
        style={{ display: 'none' }}
    />
</div>
```

### 2. **CreateShopModal.css** - Styling

#### Thay thế `.image-input-group` bằng `.image-upload-group`:
```css
.image-upload-group {
    margin-bottom: 1rem;
}

.btn-upload-image {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 2rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 12px;
    font-weight: 600;
    font-size: 0.9375rem;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-upload-image:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.btn-upload-image:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
}

.upload-spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}
```

#### Cập nhật `.btn-remove-image`:
```css
.btn-remove-image:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
```

## ✨ Tính năng mới

### 1. **Upload nhiều file cùng lúc**
- Người dùng có thể chọn nhiều ảnh cùng một lúc
- Tất cả ảnh sẽ được upload song song (parallel)

### 2. **Validation**
- ✅ Kiểm tra file type (chỉ chấp nhận image/*)
- ✅ Kiểm tra file size (tối đa 5MB/ảnh)
- ✅ Kiểm tra số lượng ảnh (tối đa 10 ảnh)

### 3. **UX/UI cải thiện**
- 📤 Button upload đẹp với icon và text rõ ràng
- ⏳ Loading spinner khi đang upload
- 🚫 Disable button khi đang upload hoặc đã đủ 10 ảnh
- 🗑️ Disable nút xóa khi đang upload
- ✅ Reset file input sau khi upload thành công

### 4. **Error handling**
- Hiển thị lỗi cụ thể cho từng trường hợp:
  - File không phải hình ảnh
  - File quá lớn (>5MB)
  - Vượt quá giới hạn 10 ảnh
  - Lỗi upload từ server

## 🎯 User Flow

1. **Người dùng click button "📤 Chọn ảnh để tải lên"**
2. **File picker mở ra** (có thể chọn nhiều ảnh)
3. **Validation diễn ra**:
   - Kiểm tra type, size, số lượng
   - Hiển thị lỗi nếu có
4. **Upload bắt đầu**:
   - Button chuyển sang "⏳ Đang tải lên..."
   - Tất cả ảnh được upload song song
5. **Hoàn thành**:
   - Ảnh hiển thị trong grid preview
   - File input được reset
   - Button trở lại trạng thái ban đầu

## 🔧 API sử dụng

### UploadService.uploadFile(file)
- **Input**: File object
- **Output**: Promise<string> (URL của ảnh đã upload)
- **Endpoint**: POST `/api/upload`
- **Content-Type**: multipart/form-data

## 📱 Responsive
- Button upload responsive
- Grid ảnh tự động điều chỉnh theo màn hình
- Preview ảnh với aspect-ratio cố định

## 🐛 Bug fixes
- ✅ File input được reset sau mỗi lần upload (tránh upload trùng)
- ✅ Error state được clear trước khi upload mới
- ✅ Loading state prevents duplicate uploads

## 🚀 Performance
- ✅ Upload song song (Promise.all) thay vì tuần tự
- ✅ Validation trước khi upload (tiết kiệm bandwidth)
- ✅ Giới hạn file size (5MB/file)

## 📝 Notes
- Service UploadService đã có sẵn trong project
- API endpoint `/api/upload` đã được implement ở backend
- Giữ nguyên formData.imageShopUrl là array of strings (URLs)
- Tương thích 100% với backend hiện tại

