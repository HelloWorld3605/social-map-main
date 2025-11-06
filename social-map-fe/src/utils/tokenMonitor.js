// utils/tokenMonitor.js

/**
 * Token Monitor - Kiểm tra và refresh token trước khi hết hạn
 * Tự động reconnect WebSocket khi token được refresh
 */

let refreshTimer = null;

/**
 * Decode JWT token to get expiration time
 */
function decodeToken(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('[TokenMonitor] Error decoding token:', error);
        return null;
    }
}

/**
 * Get token expiration time in milliseconds
 */
function getTokenExpiration(token) {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
        return null;
    }
    return decoded.exp * 1000; // Convert to milliseconds
}

/**
 * Get time until token expires (in milliseconds)
 */
function getTimeUntilExpiry(token) {
    const expirationTime = getTokenExpiration(token);
    if (!expirationTime) {
        return null;
    }
    const now = Date.now();
    return expirationTime - now;
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token) {
    if (!token) return true;
    const timeUntilExpiry = getTimeUntilExpiry(token);
    return timeUntilExpiry === null || timeUntilExpiry <= 0;
}

/**
 * Check if token will expire soon (within 2 minutes)
 */
export function isTokenExpiringSoon(token) {
    if (!token) return true;
    const timeUntilExpiry = getTimeUntilExpiry(token);
    const twoMinutes = 2 * 60 * 1000;
    return timeUntilExpiry === null || timeUntilExpiry < twoMinutes;
}

/**
 * Schedule automatic token refresh before expiration
 * @param {Function} refreshCallback - Function to call when refreshing token
 */
export function scheduleTokenRefresh(refreshCallback) {
    // Clear existing timer
    if (refreshTimer) {
        clearTimeout(refreshTimer);
        refreshTimer = null;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
        console.warn('[TokenMonitor] No token found');
        return;
    }

    const timeUntilExpiry = getTimeUntilExpiry(token);
    if (timeUntilExpiry === null || timeUntilExpiry <= 0) {
        console.warn('[TokenMonitor] Token already expired');
        refreshCallback?.();
        return;
    }

    // Refresh 1 minute before expiration
    const refreshBuffer = 60 * 1000; // 1 minute
    const refreshTime = Math.max(0, timeUntilExpiry - refreshBuffer);

    console.log(`[TokenMonitor] Token will refresh in ${Math.round(refreshTime / 1000)}s`);
    console.log(`[TokenMonitor] Token expires in ${Math.round(timeUntilExpiry / 1000)}s`);

    refreshTimer = setTimeout(async () => {
        console.log('[TokenMonitor] Auto-refreshing token...');
        try {
            await refreshCallback?.();
            console.log('[TokenMonitor] Token auto-refresh successful');

            // Schedule next refresh
            scheduleTokenRefresh(refreshCallback);
        } catch (error) {
            console.error('[TokenMonitor] Token auto-refresh failed:', error);
        }
    }, refreshTime);
}

/**
 * Stop automatic token refresh
 */
export function stopTokenRefresh() {
    if (refreshTimer) {
        clearTimeout(refreshTimer);
        refreshTimer = null;
        console.log('[TokenMonitor] Stopped automatic token refresh');
    }
}

/**
 * Get token info for debugging
 */
export function getTokenInfo(token) {
    const decoded = decodeToken(token);
    if (!decoded) {
        return null;
    }

    const timeUntilExpiry = getTimeUntilExpiry(token);
    const expirationTime = getTokenExpiration(token);

    return {
        userId: decoded.userId,
        email: decoded.email,
        displayName: decoded.displayName,
        type: decoded.type,
        issuedAt: new Date(decoded.iat * 1000),
        expiresAt: new Date(expirationTime),
        timeUntilExpiry: timeUntilExpiry,
        timeUntilExpirySeconds: Math.round(timeUntilExpiry / 1000),
        isExpired: timeUntilExpiry <= 0,
        isExpiringSoon: timeUntilExpiry < 2 * 60 * 1000
    };
}

/**
 * Log token info to console
 */
export function logTokenInfo() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.log('[TokenMonitor] No token found');
        return;
    }

    const info = getTokenInfo(token);
    console.log('[TokenMonitor] Token Info:', info);
}

