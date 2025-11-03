/**
 * Kiểm tra xem error có phải là lỗi tài khoản bị xóa không
 * @param {Error} error - Error object từ API
 * @returns {boolean} - True nếu là lỗi tài khoản bị xóa
 */
export const isDeletedAccountError = (error) => {
    const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        '';

    return errorMessage.includes('đã bị xóa trong hệ thống') ||
           errorMessage.includes('liên hệ admin');
};

/**
 * Hiển thị alert cho lỗi tài khoản bị xóa và logout
 * @param {Error} error - Error object từ API
 */
export const handleDeletedAccountError = (error) => {
    if (isDeletedAccountError(error)) {
        // Clear localStorage
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');

        // Show alert
        const errorMessage =
            error?.response?.data?.message ||
            error?.response?.data ||
            'Tài khoản của bạn đã bị xóa trong hệ thống. Vui lòng liên hệ admin để được hỗ trợ.';

        alert('⚠️ ' + errorMessage);

        // Redirect to login
        window.location.href = '/login';

        return true;
    }

    return false;
};

/**
 * Lấy error message từ error object
 * @param {Error} error - Error object
 * @returns {string} - Error message
 */
export const getErrorMessage = (error) => {
    if (error?.response?.data?.message) {
        return error.response.data.message;
    }

    if (error?.response?.data) {
        return typeof error.response.data === 'string'
            ? error.response.data
            : JSON.stringify(error.response.data);
    }

    if (error?.message) {
        return error.message;
    }

    return 'Có lỗi xảy ra. Vui lòng thử lại.';
};

