import axios from 'axios';
import { handleError } from '../utils/errorHandler';

const BASE_URL = "http://localhost:8080/api";

// Tạo axios instance chung
const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: 10000, // 10 giây timeout
});

// Request interceptor - tự động thêm token vào header
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        console.log('API Request:', config.method?.toUpperCase(), config.url);
        console.log('Token from localStorage:', token ? 'EXISTS' : 'NOT FOUND');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('Authorization header set');
        } else {
            console.warn('⚠️ No token found in localStorage!');
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - xử lý response và lỗi
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Lấy error message
        const errorMessage = error.response?.data?.message || error.response?.data || error.message || '';

        // Xử lý lỗi tài khoản bị xóa
        if (errorMessage.includes('đã bị xóa trong hệ thống') || errorMessage.includes('liên hệ admin')) {
            // Clear localStorage
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');

            // Show alert
            alert('⚠️ Tài khoản của bạn đã bị xóa trong hệ thống. Vui lòng liên hệ admin để được hỗ trợ.');

            // Redirect to login
            window.location.href = '/login';
            return Promise.reject(error);
        }

        // Xử lý lỗi 401 - token hết hạn
        if (error.response?.status === 401) {
            // Kiểm tra nếu không phải từ trang login
            if (!window.location.pathname.includes('/login')) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

// Helper functions cho các HTTP methods
export const api = {
    get: async (url, config = {}) => {
        try {
            const response = await apiClient.get(url, config);
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    },

    post: async (url, data = {}, config = {}) => {
        try {
            const response = await apiClient.post(url, data, config);
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    },

    put: async (url, data = {}, config = {}) => {
        try {
            const response = await apiClient.put(url, data, config);
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    },

    delete: async (url, config = {}) => {
        try {
            const response = await apiClient.delete(url, config);
            return response.data;
        } catch (error) {
            throw handleError(error);
        }
    }
};

// Export để có thể sử dụng trực tiếp axios instance nếu cần
export default apiClient;