/**
 * Xử lý và format lỗi từ API calls
 * @param {Error} error - Lỗi từ axios
 * @returns {Error} - Error object đã được format
 */
export function handleError(error) {
    // Log error để debug (có thể tắt trong production)
    if (process.env.NODE_ENV !== 'production') { // eslint-disable-line no-undef
        console.error('Service Error:', error);
    }

    // Lỗi từ server (có response)
    if (error.response) {
        const { status, data } = error.response;

        // Xử lý các status code phổ biến
        switch (status) {
            case 400:
                return new Error(data?.message || 'Dữ liệu không hợp lệ');
            case 401:
                return new Error('Phiên đăng nhập đã hết hạn');
            case 403:
                return new Error('Bạn không có quyền thực hiện hành động này');
            case 404:
                return new Error('Không tìm thấy tài nguyên yêu cầu');
            case 409:
                return new Error(data?.message || 'Dữ liệu đã tồn tại');
            case 422:
                return new Error(data?.message || 'Dữ liệu không hợp lệ');
            case 429:
                return new Error('Quá nhiều yêu cầu, vui lòng thử lại sau');
            case 500:
                return new Error('Lỗi server, vui lòng thử lại sau');
            case 503:
                return new Error('Dịch vụ tạm thời không khả dụng');
            default:
                return new Error(data?.message || `HTTP Error ${status}`);
        }
    }

    // Lỗi network (có request nhưng không có response)
    if (error.request) {
        if (error.code === 'NETWORK_ERROR') {
            return new Error('Không thể kết nối mạng');
        }
        if (error.code === 'ECONNABORTED') {
            return new Error('Yêu cầu timeout, vui lòng thử lại');
        }
        return new Error('Không thể kết nối đến server');
    }

    // Lỗi khác (setup request, etc.)
    return new Error(error.message || 'Đã xảy ra lỗi không xác định');
}

/**
 * Lấy message lỗi để hiển thị cho user
 * @param {Error} error - Error object
 * @returns {string} - Message để hiển thị
 */
export function getErrorMessage(error) {
    if (error?.response?.data?.message) {
        return error.response.data.message;
    }
    return error?.message || 'Đã xảy ra lỗi không xác định';
}

/**
 * Kiểm tra loại lỗi
 * @param {Error} error - Error object
 * @returns {object} - Object chứa thông tin loại lỗi
 */
export function getErrorType(error) {
    if (error?.response) {
        return {
            type: 'server',
            status: error.response.status,
            data: error.response.data
        };
    }

    if (error?.request) {
        return {
            type: 'network',
            code: error.code
        };
    }

    return {
        type: 'client',
        message: error?.message
    };
}
