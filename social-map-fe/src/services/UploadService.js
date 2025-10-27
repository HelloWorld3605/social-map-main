// Import api helper từ apiClient.js
// Hãy chắc chắn đường dẫn (path) là chính xác, ví dụ: './apiClient' hoặc '../api/apiClient'
import { api } from './apiClient';

/**
 * Upload một file lên server.
 * @param {File} file - Đối tượng File (thường lấy từ <input type="file">)
 * @returns {Promise<string>} Một promise giải quyết (resolves) với URL của file đã upload.
 * @throws Sẽ ném ra lỗi (đã được xử lý bởi 'handleError' trong apiClient) nếu upload thất bại.
 */
const uploadFile = async (file) => {
    // 1. Tạo một đối tượng FormData.
    // Đây là điều bắt buộc để gửi file theo dạng 'multipart/form-data'.
    const formData = new FormData();

    // 2. Thêm file vào FormData.
    // Key 'file' phải trùng khớp với @RequestParam("file") trong Spring Boot Controller.
    formData.append('file', file);

    // 3. Gọi api.post.
    // URL là '/upload' vì BASE_URL ('/api') đã được cấu hình trong apiClient.
    // Axios sẽ tự động đặt 'Content-Type': 'multipart/form-data'
    // (cùng với 'boundary' cần thiết) vì chúng ta đang truyền một đối tượng FormData.
    //
    // Controller của bạn trả về ResponseEntity.ok(saved.getUrl()),
    // và api.post helper trả về response.data, vì vậy 'responseUrl' sẽ là chuỗi URL.
    const responseUrl = await api.post('/upload', formData);

    return responseUrl;
};

// Export các hàm của service
export const UploadService = {
    uploadFile,
};