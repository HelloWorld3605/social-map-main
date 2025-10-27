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
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
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
        // Xử lý lỗi 401 - token hết hạn
        if (error.response?.status === 401) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userInfo');
            // Redirect to login page if needed
            window.location.href = '/login';
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