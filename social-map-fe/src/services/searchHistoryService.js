import { api } from './apiClient';

export const searchHistoryService = {
    /**
     * Lưu lịch sử tìm kiếm
     * POST /api/search-history
     */
    saveSearchHistory: async (query, type, data = null) => {
        return await api.post('/search-history', { query, type, data });
    },

    /**
     * Lấy lịch sử tìm kiếm của người dùng (dựa vào JWT)
     * GET /api/search-history
     */
    getSearchHistory: async () => {
        return await api.get('/search-history');
    },

    /**
     * Xóa toàn bộ lịch sử tìm kiếm của người dùng (dựa vào JWT)
     * DELETE /api/search-history
     */
    deleteSearchHistory: async () => {
        return await api.delete('/search-history');
    },

    /**
     * Xóa một lịch sử tìm kiếm cụ thể
     * DELETE /api/search-history/{id}
     */
    deleteSearchHistoryItem: async (id) => {
        return await api.delete(`/search-history/${id}`);
    },
};
