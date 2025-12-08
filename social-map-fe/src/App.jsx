import './App.css'
import './styles/general.css';
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/Auth/login-page';
import RegisterPage from './pages/Auth/register-page';
import ValidateTokenPage from './pages/Auth/validate-token-page';
import CompleteRegistrationPage from './pages/Auth/complete-registration-page';
import ForgotPasswordPage from './pages/Auth/forgot-password-page';
import ResetPasswordPage from './pages/Auth/reset-password-page';
import HomePage from './pages/HomePage/HomePage';
import ProfilePage from './pages/ProfilePage/ProfilePage';
import DashboardPage from './pages/DashboardPage/DashboardPage';
import SellerRequestsPage from './pages/DashboardPage/SellerRequestsPage';
import UsersManagementPage from './pages/DashboardPage/UsersManagementPage';
import ShopManagementDashboard from './pages/DashboardPage/ShopManagementDashboard';
import MainLayout from './components/Layout/MainLayout';
import { webSocketService } from './services/WebSocketChatService';
import {
  isTokenExpired,
  initTokenMonitor,
  cleanupTokenMonitor
} from './utils/tokenMonitor';
import apiClient from './services/apiClient';
import useHeartbeat from './hooks/useHeartbeat';

function App() {
  // Use heartbeat hook for online status
  useHeartbeat();

  // 🆕 WebSocket event handling (auth errors, max reconnect)
  useEffect(() => {
    // 🆕 Lắng nghe WebSocket events
    const handleWebSocketAuthError = async () => {
      console.warn('🔐 WebSocket auth error - attempting token refresh...');
      try {
        const refreshResponse = await apiClient.post('/auth/refresh');
        const newToken = refreshResponse.data.accessToken;
        localStorage.setItem('authToken', newToken);
        console.log('✅ Token refreshed due to WebSocket auth error');

        // Reconnect WebSocket with new token
        webSocketService.reconnect();
      } catch (error) {
        console.error('❌ Token refresh failed:', error);
        // Force logout if refresh fails
        localStorage.clear();
        sessionStorage.clear();
        webSocketService.disconnect();
        window.location.replace('/login');
      }
    };

    const handleWebSocketMaxReconnect = () => {
      console.error('🔄 Max WebSocket reconnect attempts reached - reloading page');
      window.location.reload();
    };

    window.addEventListener('websocket-auth-error', handleWebSocketAuthError);
    window.addEventListener('websocket-max-reconnect-reached', handleWebSocketMaxReconnect);

    // Cleanup
    return () => {
      window.removeEventListener('websocket-auth-error', handleWebSocketAuthError);
      window.removeEventListener('websocket-max-reconnect-reached', handleWebSocketMaxReconnect);
    };
  }, []);

  // 🌐 Kết nối WebSocket toàn cục khi App mount và có authToken
  useEffect(() => {
    // 🆕 Token refresh callback - được sử dụng bởi tokenMonitor
    // Chỉ thực hiện refresh, KHÔNG handle logout (để tokenMonitor xử lý với retry)
    const tokenRefreshCallback = async () => {
      console.log('🔄 Token refresh triggered...');
      const refreshResponse = await apiClient.post('/auth/refresh');
      const newToken = refreshResponse.data.accessToken;
      localStorage.setItem('authToken', newToken);
      console.log('✅ Token refreshed successfully');

      // 🆕 WebSocket sẽ được reconnect bởi tokenMonitor sau khi refresh thành công
      // Không reconnect ở đây để tránh race condition

      return newToken;
    };

    const connectWebSocket = () => {
      const token = localStorage.getItem('authToken');

      // ⚠️ Kiểm tra token có hết hạn không
      if (token && isTokenExpired(token)) {
        console.warn('⚠️ Token đã hết hạn, thử refresh...');
        tokenRefreshCallback().catch(() => {
          // 🆕 Đánh dấu logout cho multi-tab sync
          localStorage.setItem('logout', Date.now().toString());
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          sessionStorage.clear();
          window.location.replace('/login');
        });
        return;
      }

      if (token) {
        console.log('🌐 Kết nối WebSocket toàn cục');
        webSocketService.connect(
          () => {
            console.log('✅ Global WebSocket connected');
          },
          (error) => console.error('❌ Global WebSocket error:', error)
        );

        // 🆕 Khởi tạo Token Monitor với visibility tracking, auto-refresh, multi-tab sync
        // Truyền webSocketService để tokenMonitor có thể kiểm tra connection status
        console.log('⏰ Initializing Token Monitor...');
        initTokenMonitor(tokenRefreshCallback, webSocketService);
      } else {
        console.log('⏸️ Chưa có authToken, bỏ qua kết nối WebSocket');
      }
    };

    // Kết nối WebSocket ngay khi mount (nếu có token)
    connectWebSocket();

    // Lắng nghe logout event để cleanup WebSocket và Token Monitor
    const handleLogout = () => {
      console.log('👋 Đăng xuất - ngắt kết nối WebSocket và cleanup Token Monitor');
      // 🆕 Đánh dấu logout để các tab khác biết (multi-tab sync)
      localStorage.setItem('logout', Date.now().toString());
      webSocketService.disconnect();
      cleanupTokenMonitor();
    };

    // Lắng nghe login event để kết nối WebSocket sau khi đăng nhập
    const handleLogin = () => {
      console.log('🔐 Login event received - connecting WebSocket');
      // 🆕 Xóa flag logout khi login mới
      localStorage.removeItem('logout');
      connectWebSocket();
    };

    window.addEventListener('logout', handleLogout);
    window.addEventListener('login', handleLogin);

    // Cleanup khi App unmount
    return () => {
      console.log('🧹 App unmount - đóng WebSocket và cleanup Token Monitor');
      webSocketService.disconnect();
      cleanupTokenMonitor();
      window.removeEventListener('logout', handleLogout);
      window.removeEventListener('login', handleLogin);
    };
  }, []);
  // Kiểm tra xem người dùng đã đăng nhập chưa
  const isAuthenticated = () => {
    return localStorage.getItem('authToken') !== null;
  };

  // Component bảo vệ route - chỉ cho phép truy cập nếu đã đăng nhập
  const ProtectedRoute = ({ children }) => {
    return isAuthenticated() ? children : <Navigate to="/login" replace />;
  };

  // Component bảo vệ route cho admin
  const AdminRoute = ({ children }) => {
    if (!isAuthenticated()) {
      return <Navigate to="/login" replace />;
    }

    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
          return children;
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }

    // Nếu không phải admin, redirect về home
    return <Navigate to="/home" replace />;
  };

  return (
    <Router>
      <Routes>
        {/* Trang đăng nhập - KHÔNG có layout */}
        <Route path="/login" element={<LoginPage />} />

        {/* Trang đăng ký - KHÔNG có layout */}
        <Route path="/register" element={<RegisterPage />} />

        {/* Trang xác thực token - KHÔNG có layout */}
        <Route path="/validate-token/:token" element={<ValidateTokenPage />} />

        {/* Trang hoàn tất đăng ký - KHÔNG có layout */}
        <Route path="/complete-registration" element={<CompleteRegistrationPage />} />

        {/* Trang quên mật khẩu - KHÔNG có layout */}
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Trang đặt lại mật khẩu - KHÔNG có layout */}
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Trang chính - Map fullscreen với MainLayout */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />

        {/* Trang Dashboard cho Admin */}
        <Route
          path="/dashboard"
          element={
            <AdminRoute>
              <MainLayout>
                <DashboardPage />
              </MainLayout>
            </AdminRoute>
          }
        />

        {/* Trang Seller Requests cho Admin */}
        <Route
          path="/dashboard/seller-requests"
          element={
            <AdminRoute>
              <MainLayout>
                <SellerRequestsPage />
              </MainLayout>
            </AdminRoute>
          }
        />

        {/* Trang Users Management cho Admin */}
        <Route
          path="/dashboard/users"
          element={
            <AdminRoute>
              <MainLayout>
                <UsersManagementPage />
              </MainLayout>
            </AdminRoute>
          }
        />

        {/* Trang Shop Management cho Admin */}
        <Route
          path="/dashboard/shops"
          element={
            <AdminRoute>
              <MainLayout>
                <ShopManagementDashboard />
              </MainLayout>
            </AdminRoute>
          }
        />

        {/* Trang cá nhân - Normal scroll với MainLayout */}
        <Route
          path="/profile/:userId"
          element={
            <ProtectedRoute>
              <MainLayout>
                <ProfilePage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Trang cá nhân của mình - Normal scroll với MainLayout */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <MainLayout>
                <ProfilePage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Redirect từ / đến /home hoặc /login */}
        <Route
          path="/"
          element={
            isAuthenticated() ? <Navigate to="/home" replace /> : <Navigate to="/login" replace />
          }
        />

        {/* Route không tồn tại - redirect về trang chính */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
