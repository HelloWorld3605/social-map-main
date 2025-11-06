// services/shopMapService.js
import { api } from './apiClient';

/**
 * Service for map-related shop operations
 * Handles bounding box queries, clustering, and debouncing
 */

/**
 * Lấy shops hoặc clusters trong vùng bản đồ
 * Tự động quyết định clustering dựa vào zoom level
 */
export const getShopsInMapView = async (bounds, zoom, limit = null) => {
    const params = {
        north: bounds.north,
        south: bounds.south,
        east: bounds.east,
        west: bounds.west,
    };

    if (zoom !== null && zoom !== undefined) {
        params.zoom = zoom;
    }

    if (limit) {
        params.limit = limit;
    }

    return await api.get('/shops/map', { params });
};

/**
 * Lấy individual shops (không cluster)
 * Dùng cho zoom level cao
 */
export const getIndividualShops = async (bounds, limit = 500) => {
    const params = {
        north: bounds.north,
        south: bounds.south,
        east: bounds.east,
        west: bounds.west,
        limit: limit,
    };

    return await api.get('/shops/map/individual', { params });
};

/**
 * Lấy clusters (luôn cluster)
 * Dùng cho zoom level thấp
 */
export const getClusters = async (bounds) => {
    const params = {
        north: bounds.north,
        south: bounds.south,
        east: bounds.east,
        west: bounds.west,
    };

    return await api.get('/shops/map/clusters', { params });
};

/**
 * POST method - dùng cho complex queries
 */
export const getShopsInBounds = async (boundingBoxRequest) => {
    return await api.post('/shops/map/bounds', boundingBoxRequest);
};

/**
 * Debounce utility function
 * Delays execution until user stops interacting
 */
export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

/**
 * Throttle utility function
 * Limits execution rate
 */
export const throttle = (func, limit) => {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

