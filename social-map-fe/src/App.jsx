import './App.css'
import './styles/general.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/Auth/login-page';
import RegisterPage from './pages/Auth/register-page';
import ValidateTokenPage from './pages/Auth/validate-token-page';
import CompleteRegistrationPage from './pages/Auth/complete-registration-page';
import HomePage from './pages/HomePage/HomePage';
import ProfilePage from './pages/ProfilePage/ProfilePage';
import DashboardPage from './pages/DashboardPage/DashboardPage';
import SellerRequestsPage from './pages/DashboardPage/SellerRequestsPage';
import UsersManagementPage from './pages/DashboardPage/UsersManagementPage';
import ShopManagementDashboard from './pages/DashboardPage/ShopManagementDashboard';
import MainLayout from './components/Layout/MainLayout';

function App() {
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

