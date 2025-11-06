import axios from 'axios';
import { handleError } from '../utils/errorHandler';

const BASE_URL = "http://localhost:8080/api";

// Tạo axios instance chung
const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: 10000, // 10 giây timeout
    withCredentials: true, // Quan trọng: Cho phép gửi cookie (refreshToken)
});

// Biến để tránh refresh token nhiều lần đồng thời
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

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
    async (error) => {
        const originalRequest = error.config;

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
        if (error.response?.status === 401 && !originalRequest._retry) {
            // Không refresh nếu đang ở trang login hoặc đang gọi endpoint refresh
            if (window.location.pathname.includes('/login') || originalRequest.url.includes('/auth/refresh')) {
                return Promise.reject(error);
            }

            if (isRefreshing) {
                // Nếu đang refresh, thêm request vào hàng đợi
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers['Authorization'] = 'Bearer ' + token;
                    return apiClient(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Gọi API refresh token (cookie sẽ tự động được gửi)
                console.log('🔄 Access token hết hạn, đang làm mới...');
                const response = await apiClient.post('/auth/refresh');
                const newAccessToken = response.data.accessToken;

                // Lưu access token mới
                localStorage.setItem('authToken', newAccessToken);
                console.log('✅ Access token đã được làm mới');

                // Cập nhật header cho request ban đầu
                originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken;

                // Xử lý các request đang chờ
                processQueue(null, newAccessToken);

                isRefreshing = false;

                // ✨ RECONNECT WEBSOCKET với token mới
                try {
                    const { webSocketService } = await import('./WebSocketChatService');
                    if (webSocketService && webSocketService.reconnect) {
                        console.log('🔌 Reconnecting WebSocket with new token...');
                        webSocketService.reconnect();
                    }
                } catch (wsError) {
                    console.warn('WebSocket reconnect failed:', wsError);
                }

                // Thực hiện lại request ban đầu
                return apiClient(originalRequest);
            } catch (refreshError) {
                // Refresh token thất bại -> đăng xuất
                processQueue(refreshError, null);
                isRefreshing = false;

                console.error('❌ Refresh token thất bại, đăng xuất và reload trang');

                // Clear all data
                localStorage.clear();
                sessionStorage.clear();

                // Disconnect WebSocket trước khi reload
                try {
                    const { webSocketService } = await import('./WebSocketChatService');
                    if (webSocketService && webSocketService.disconnect) {
                        webSocketService.disconnect();
                    }
                } catch (wsError) {
                    console.warn('WebSocket disconnect error:', wsError);
                }

                // Force reload để reset app state hoàn toàn
                window.location.replace('/login');

                return Promise.reject(refreshError);
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