import './App.css'
import './styles/general.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/Auth/login-page';
import RegisterPage from './pages/Auth/register-page';
import ValidateTokenPage from './pages/Auth/validate-token-page';
import CompleteRegistrationPage from './pages/Auth/complete-registration-page';
import HomePage from './pages/HomePage/HomePage';
import ProfilePage from './pages/ProfilePage/ProfilePage';
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
