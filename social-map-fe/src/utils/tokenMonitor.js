// utils/tokenMonitor.js

/**
 * Token Monitor - Kiểm tra và refresh token trước khi hết hạn
 * Tự động reconnect WebSocket khi token được refresh
 * ✨ Hỗ trợ Page Visibility API để detect khi user quay lại tab
 * ✨ Auto-refresh và reload page khi cần thiết (giống Facebook)
 * ✨ Mutex để tránh race condition khi refresh token
 * ✨ Exponential backoff retry khi refresh fail
 * ✨ Multi-tab sync với storage listener
 */

let refreshTimer = null;
let backgroundRefreshTimer = null;
let visibilityCheckTimer = null;
let lastVisibleTime = Date.now();
let lastTokenCheck = Date.now();
let refreshCallback = null;

// 🆕 Mutex để tránh race condition
let isRefreshing = false;
let refreshPromise = null;

// Config
const CONFIG = {
    REFRESH_BUFFER: 60 * 1000,           // Refresh 1 phút trước khi hết hạn
    BACKGROUND_REFRESH_INTERVAL: 10 * 60 * 1000,  // 🆕 10 phút (giống Facebook)
    VISIBILITY_CHECK_INTERVAL: 30 * 1000,  // Check mỗi 30s khi tab visible
    MAX_HIDDEN_TIME: 30 * 60 * 1000,      // Reload nếu tab hidden quá 30 phút
    TOKEN_CHECK_ON_FOCUS_THRESHOLD: 5 * 60 * 1000, // Kiểm tra token nếu hidden > 5 phút
    STALE_PAGE_THRESHOLD: 60 * 60 * 1000,  // Reload nếu page stale > 1 giờ
    MAX_RETRY_ATTEMPTS: 3,                 // 🆕 Số lần retry refresh
    RETRY_BASE_DELAY: 500,                 // 🆕 Base delay cho exponential backoff (ms)
};

// 🆕 WebSocket service reference (sẽ được inject từ App.jsx)
let webSocketServiceRef = null;

/**
 * 🆕 Set WebSocket service reference để kiểm tra connection status
 */
export function setWebSocketService(wsService) {
    webSocketServiceRef = wsService;
}

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
 * 🆕 Safe refresh với mutex - đảm bảo chỉ 1 refresh chạy tại 1 thời điểm
 * Tránh race condition khi nhiều nguồn cùng trigger refresh
 */
async function safeRefresh() {
    // Nếu đang refresh, chờ promise hiện tại
    if (isRefreshing && refreshPromise) {
        console.log('[TokenMonitor] Refresh already in progress, waiting...');
        return refreshPromise;
    }

    if (!refreshCallback) {
        console.warn('[TokenMonitor] No refresh callback registered');
        return;
    }

    isRefreshing = true;

    refreshPromise = (async () => {
        try {
            console.log('[TokenMonitor] Starting safe refresh...');
            await refreshCallback();
            lastTokenCheck = Date.now();
            console.log('[TokenMonitor] Safe refresh completed');
        } finally {
            isRefreshing = false;
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}

/**
 * 🆕 Retry refresh với exponential backoff
 * Giống Facebook: retry trước khi logout
 */
async function retryRefresh(maxRetries = CONFIG.MAX_RETRY_ATTEMPTS) {
    let attempt = 0;
    let lastError = null;

    while (attempt < maxRetries) {
        try {
            await safeRefresh();
            return true; // Success
        } catch (err) {
            lastError = err;
            attempt++;
            console.warn(`[TokenMonitor] Refresh attempt ${attempt}/${maxRetries} failed:`, err.message);

            if (attempt < maxRetries) {
                // Exponential backoff: 500ms, 1000ms, 1500ms...
                const delay = CONFIG.RETRY_BASE_DELAY * attempt;
                console.log(`[TokenMonitor] Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    console.error('[TokenMonitor] All refresh attempts failed:', lastError);
    return false; // All retries failed
}

/**
 * 🆕 Handle refresh failure - logout và redirect
 */
function handleRefreshFailure() {
    console.error('[TokenMonitor] Refresh failed completely, forcing logout...');

    // Đánh dấu logout để các tab khác biết
    localStorage.setItem('logout', Date.now().toString());

    // Clear all data
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    sessionStorage.clear();

    // Disconnect WebSocket if available
    if (webSocketServiceRef?.disconnect) {
        webSocketServiceRef.disconnect();
    }

    // Redirect to login
    window.location.replace('/login');
}

/**
 * Schedule automatic token refresh before expiration
 * @param {Function} callback - Function to call when refreshing token
 */
export function scheduleTokenRefresh(callback) {
    // Save callback for visibility handler
    if (callback) {
        refreshCallback = callback;
    }

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
        console.warn('[TokenMonitor] Token already expired, attempting refresh with retry...');
        // 🆕 Sử dụng retryRefresh thay vì gọi trực tiếp
        retryRefresh().then(success => {
            if (!success) {
                handleRefreshFailure();
            }
        });
        return;
    }

    // Refresh 1 minute before expiration
    const refreshTime = Math.max(0, timeUntilExpiry - CONFIG.REFRESH_BUFFER);

    console.log(`[TokenMonitor] Token will refresh in ${Math.round(refreshTime / 1000)}s`);
    console.log(`[TokenMonitor] Token expires in ${Math.round(timeUntilExpiry / 1000)}s`);

    refreshTimer = setTimeout(async () => {
        console.log('[TokenMonitor] Auto-refreshing token...');
        // 🆕 Sử dụng safeRefresh thay vì refreshCallback trực tiếp
        const success = await retryRefresh();
        if (success) {
            console.log('[TokenMonitor] Token auto-refresh successful');
            // Schedule next refresh
            scheduleTokenRefresh();
        } else {
            console.error('[TokenMonitor] Token auto-refresh failed after retries');
            handleRefreshFailure();
        }
    }, refreshTime);
}

/**
 * Start background token refresh (every 10 minutes as fallback - giống Facebook)
 * @param {Function} callback - Function to call when refreshing token
 */
export function startBackgroundTokenRefresh(callback) {
    // Save callback if provided
    if (callback) {
        refreshCallback = callback;
    }

    // Clear existing background timer
    if (backgroundRefreshTimer) {
        clearInterval(backgroundRefreshTimer);
        backgroundRefreshTimer = null;
    }

    console.log('[TokenMonitor] Starting background token refresh every 10 minutes');

    // 🆕 Refresh every 10 minutes như Facebook - không kiểm tra expiring soon
    // Điều này đảm bảo token luôn được refresh ngay cả khi timer bị throttled
    backgroundRefreshTimer = setInterval(async () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.warn('[TokenMonitor] No token found for background refresh');
            return;
        }

        // 🆕 Chỉ kiểm tra token còn valid, refresh đều đặn bất kể expiring hay không
        if (!isTokenExpired(token)) {
            console.log('[TokenMonitor] Background token refresh...');
            const success = await retryRefresh();
            if (success) {
                console.log('[TokenMonitor] Background token refresh successful');
            } else {
                console.error('[TokenMonitor] Background token refresh failed');
                // Không logout ngay, để scheduleTokenRefresh xử lý
            }
        } else {
            console.warn('[TokenMonitor] Token expired during background check, attempting refresh...');
            const success = await retryRefresh();
            if (!success) {
                handleRefreshFailure();
            }
        }
    }, CONFIG.BACKGROUND_REFRESH_INTERVAL);
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

    if (backgroundRefreshTimer) {
        clearInterval(backgroundRefreshTimer);
        backgroundRefreshTimer = null;
        console.log('[TokenMonitor] Stopped background token refresh');
    }

    if (visibilityCheckTimer) {
        clearInterval(visibilityCheckTimer);
        visibilityCheckTimer = null;
        console.log('[TokenMonitor] Stopped visibility check timer');
    }

    // Reset callback
    refreshCallback = null;
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

/**
 * 🆕 Handle page visibility change - kiểm tra và refresh token khi user quay lại tab
 * Giống như cách Facebook xử lý
 */
async function handleVisibilityChange() {
    const isVisible = document.visibilityState === 'visible';

    if (isVisible) {
        const hiddenDuration = Date.now() - lastVisibleTime;
        console.log(`[TokenMonitor] Tab became visible after ${Math.round(hiddenDuration / 1000)}s`);

        const token = localStorage.getItem('authToken');

        // 🆕 Giống Facebook Messenger: chỉ reload khi THỰC SỰ cần thiết
        // Tab hidden quá lâu VÀ (WebSocket mất kết nối HOẶC token hết hạn)
        if (hiddenDuration > CONFIG.MAX_HIDDEN_TIME) {
            const wsDisconnected = webSocketServiceRef && !webSocketServiceRef.isConnected?.();
            const tokenExpired = !token || isTokenExpired(token);

            if (wsDisconnected || tokenExpired) {
                console.log('[TokenMonitor] Tab was hidden too long and connection/token invalid, reloading page...');
                window.location.reload();
                return;
            }
            console.log('[TokenMonitor] Tab was hidden long but WebSocket still connected, continuing...');
        }

        // Kiểm tra token khi focus lại sau một thời gian
        if (hiddenDuration > CONFIG.TOKEN_CHECK_ON_FOCUS_THRESHOLD) {
            console.log('[TokenMonitor] Checking token after long hidden period...');
            await checkAndRefreshTokenOnFocus();
        }

        // Reschedule token refresh timer (vì timer có thể bị throttled khi hidden)
        if (token && !isTokenExpired(token)) {
            scheduleTokenRefresh();
        }
    } else {
        lastVisibleTime = Date.now();
        console.log('[TokenMonitor] Tab became hidden');
    }
}

/**
 * 🆕 Kiểm tra và refresh token khi user quay lại tab
 */
async function checkAndRefreshTokenOnFocus() {
    const token = localStorage.getItem('authToken');

    if (!token) {
        console.warn('[TokenMonitor] No token found on focus check');
        // Redirect to login if no token
        handleRefreshFailure();
        return;
    }

    // Token đã hết hạn hoàn toàn
    if (isTokenExpired(token)) {
        console.warn('[TokenMonitor] Token expired, attempting refresh with retry...');
        const success = await retryRefresh();
        if (!success) {
            handleRefreshFailure();
        }
        return;
    }

    // Token sắp hết hạn
    if (isTokenExpiringSoon(token)) {
        console.log('[TokenMonitor] Token expiring soon, refreshing proactively...');
        await safeRefresh();
    }
}

/**
 * 🆕 Kiểm tra xem page có stale không (quá lâu không có hoạt động)
 */
function isPageStale() {
    const timeSinceLastCheck = Date.now() - lastTokenCheck;
    return timeSinceLastCheck > CONFIG.STALE_PAGE_THRESHOLD;
}

/**
 * 🆕 Start visibility monitoring với Page Visibility API
 */
export function startVisibilityMonitoring() {
    // Lắng nghe visibility change
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Lắng nghe focus/blur events như backup
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('blur', handleWindowBlur);

    // Lắng nghe online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Start periodic check khi tab visible
    startVisibilityCheckTimer();

    console.log('[TokenMonitor] Visibility monitoring started');
}

/**
 * 🆕 Stop visibility monitoring
 */
export function stopVisibilityMonitoring() {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('focus', handleWindowFocus);
    window.removeEventListener('blur', handleWindowBlur);
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);

    if (visibilityCheckTimer) {
        clearInterval(visibilityCheckTimer);
        visibilityCheckTimer = null;
    }

    console.log('[TokenMonitor] Visibility monitoring stopped');
}

/**
 * 🆕 Start visibility check timer
 */
function startVisibilityCheckTimer() {
    if (visibilityCheckTimer) {
        clearInterval(visibilityCheckTimer);
    }

    visibilityCheckTimer = setInterval(async () => {
        // Only check khi tab visible
        if (document.visibilityState === 'visible') {
            const token = localStorage.getItem('authToken');

            if (!token) {
                console.warn('[TokenMonitor] No token found during periodic check');
                return;
            }

            // Kiểm tra page stale
            if (isPageStale()) {
                // 🆕 Chỉ reload nếu WebSocket mất kết nối hoặc token hết hạn
                const wsDisconnected = webSocketServiceRef && !webSocketServiceRef.isConnected?.();
                const tokenExpired = isTokenExpired(token);

                if (wsDisconnected || tokenExpired) {
                    console.log('[TokenMonitor] Page is stale and connection invalid, reloading...');
                    window.location.reload();
                    return;
                }
            }

            // Kiểm tra token expiring soon - sử dụng safeRefresh
            if (isTokenExpiringSoon(token)) {
                console.log('[TokenMonitor] Token expiring soon during periodic check');
                await safeRefresh();
            }
        }
    }, CONFIG.VISIBILITY_CHECK_INTERVAL);
}

/**
 * 🆕 Handle window focus event
 */
async function handleWindowFocus() {
    console.log('[TokenMonitor] Window focused');
    const hiddenDuration = Date.now() - lastVisibleTime;

    if (hiddenDuration > CONFIG.TOKEN_CHECK_ON_FOCUS_THRESHOLD) {
        await checkAndRefreshTokenOnFocus();
    }
}

/**
 * 🆕 Handle window blur event
 */
function handleWindowBlur() {
    lastVisibleTime = Date.now();
    console.log('[TokenMonitor] Window blurred');
}

/**
 * 🆕 Handle online event - refresh token khi reconnect internet
 */
async function handleOnline() {
    console.log('[TokenMonitor] Browser went online');

    const token = localStorage.getItem('authToken');
    if (token) {
        // Kiểm tra và refresh token ngay khi online lại
        if (isTokenExpired(token)) {
            console.log('[TokenMonitor] Token expired, refreshing after coming online...');
            const success = await retryRefresh();
            if (!success) {
                handleRefreshFailure();
                return;
            }
        } else if (isTokenExpiringSoon(token)) {
            console.log('[TokenMonitor] Token expiring soon, refreshing after coming online...');
            await safeRefresh();
        }

        // Reschedule token refresh
        scheduleTokenRefresh();

        // 🆕 Reconnect WebSocket sau khi refresh token
        if (webSocketServiceRef?.reconnect) {
            console.log('[TokenMonitor] Reconnecting WebSocket after coming online...');
            await webSocketServiceRef.reconnect();
        }
    }
}

/**
 * 🆕 Handle offline event
 */
function handleOffline() {
    console.log('[TokenMonitor] Browser went offline');
    // Có thể hiển thị thông báo cho user
}

/**
 * 🆕 Force check and refresh token ngay lập tức
 */
export async function forceTokenCheck() {
    console.log('[TokenMonitor] Force token check triggered');
    await checkAndRefreshTokenOnFocus();
}

/**
 * 🆕 Handle storage event - sync multi-tab login/logout (giống Facebook)
 */
function handleStorageChange(event) {
    console.log(`[TokenMonitor] Storage changed: ${event.key}`);

    // Tab khác đã logout
    if (event.key === 'logout') {
        console.log('[TokenMonitor] Another tab logged out, reloading...');
        // Disconnect WebSocket
        if (webSocketServiceRef?.disconnect) {
            webSocketServiceRef.disconnect();
        }
        window.location.reload();
        return;
    }

    // Token đã được refresh ở tab khác
    if (event.key === 'authToken') {
        if (event.newValue) {
            console.log('[TokenMonitor] Token updated from another tab, rescheduling refresh...');
            lastTokenCheck = Date.now();
            // Reschedule với token mới
            scheduleTokenRefresh();

            // 🆕 Reconnect WebSocket với token mới nếu cần
            if (webSocketServiceRef?.reconnect) {
                console.log('[TokenMonitor] Reconnecting WebSocket with new token from another tab...');
                webSocketServiceRef.reconnect();
            }
        } else {
            // Token bị xóa = logout
            console.log('[TokenMonitor] Token removed from another tab, redirecting to login...');
            if (webSocketServiceRef?.disconnect) {
                webSocketServiceRef.disconnect();
            }
            window.location.replace('/login');
        }
    }
}

/**
 * 🆕 Start multi-tab sync listener
 */
export function startMultiTabSync() {
    window.addEventListener('storage', handleStorageChange);
    console.log('[TokenMonitor] Multi-tab sync started');
}

/**
 * 🆕 Stop multi-tab sync listener
 */
export function stopMultiTabSync() {
    window.removeEventListener('storage', handleStorageChange);
    console.log('[TokenMonitor] Multi-tab sync stopped');
}

/**
 * 🆕 Khởi tạo toàn bộ token monitoring system
 * @param {Function} callback - Refresh token callback
 * @param {Object} wsService - WebSocket service reference (optional)
 */
export function initTokenMonitor(callback, wsService = null) {
    if (callback) {
        refreshCallback = callback;
    }

    if (wsService) {
        webSocketServiceRef = wsService;
    }

    lastTokenCheck = Date.now();
    lastVisibleTime = Date.now();

    // Reset mutex
    isRefreshing = false;
    refreshPromise = null;

    // Schedule token refresh
    scheduleTokenRefresh();

    // Start background refresh
    startBackgroundTokenRefresh();

    // Start visibility monitoring
    startVisibilityMonitoring();

    // 🆕 Start multi-tab sync
    startMultiTabSync();

    console.log('[TokenMonitor] Token monitor initialized with all features');
}

/**
 * 🆕 Cleanup toàn bộ token monitoring
 */
export function cleanupTokenMonitor() {
    stopTokenRefresh();
    stopVisibilityMonitoring();
    stopMultiTabSync();

    // Reset state
    refreshCallback = null;
    webSocketServiceRef = null;
    isRefreshing = false;
    refreshPromise = null;

    console.log('[TokenMonitor] Token monitor cleaned up');
}

