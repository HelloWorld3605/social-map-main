import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from "react-icons/fa6";
import { login } from '../../services/authService';
import { scheduleTokenRefresh, logTokenInfo } from '../../utils/tokenMonitor';
import apiClient from '../../services/apiClient';
import './auth.css';

// Import logo
import SocialMapLogo from '/image/Social Map.svg';
import GoogleSvg from '../../assets/icons8-google.svg';

// Đây là thành phần trang đăng nhập
export default function LoginPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Hàm xử lý khi người dùng nhấn nút đăng nhập
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            setError('Vui lòng nhập cả email và mật khẩu.');
            return;
        }

        setError('');
        setLoading(true);

        // 🔥 CHỨC NĂNG TEST: Nếu email là "test@test.com", bypass API
        if (email === 'test@test.com') {
            console.log('🧪 Chế độ test - Bypass API');
            localStorage.setItem('authToken', 'fake-token-for-testing');
            alert(`Đăng nhập test thành công! Chào mừng ${email}`);
            console.log('📢 Dispatching login event for test mode...');
            window.dispatchEvent(new Event('login'));
            setLoading(false);
            navigate('/home', { replace: true });
            return;
        }

        try {
            console.log('Đang thử đăng nhập với:', { email, password });
            const response = await login({ email, password });
            console.log('Đăng nhập thành công - Full response:', response);
            console.log('Response.data:', response.data);
            console.log('Response object keys:', Object.keys(response));

            const data = response.data || response;
            console.log('Data object:', data);

            let token = null;
            if (data.accessToken) {
                token = data.accessToken;
            } else if (data.data && data.data.accessToken) {
                token = data.data.accessToken;
            } else if (data.token) {
                token = data.token;
            }

            if (token) {
                console.log('Lưu token vào localStorage:', token);
                localStorage.setItem('authToken', token);
                console.log('Token đã lưu:', localStorage.getItem('authToken'));
            } else {
                console.warn('Không tìm thấy token trong response:', data);
                throw new Error('Không nhận được token từ server');
            }

            let user = null;
            if (data.user) {
                user = data.user;
            } else if (data.data && data.data.user) {
                user = data.data.user;
            }

            if (user) {
                localStorage.setItem('user', JSON.stringify(user));
                console.log('User info đã lưu:', user);
            } else {
                console.warn('Không tìm thấy user info trong response:', data);
            }

            console.log('⏰ Scheduling automatic token refresh...');
            scheduleTokenRefresh(async () => {
                console.log('🔄 Auto-refresh triggered by token monitor');
                try {
                    const refreshResponse = await apiClient.post('/auth/refresh');
                    const newToken = refreshResponse.data.accessToken;
                    localStorage.setItem('authToken', newToken);
                    console.log('✅ Token auto-refreshed successfully');

                    const { webSocketService } = await import('../../services/WebSocketChatService');
                    if (webSocketService && webSocketService.reconnect) {
                        webSocketService.reconnect();
                    }
                } catch (error) {
                    console.error('❌ Auto-refresh failed:', error);
                    localStorage.clear();
                    sessionStorage.clear();

                    try {
                        const { webSocketService } = await import('../../services/WebSocketChatService');
                        if (webSocketService && webSocketService.disconnect) {
                            webSocketService.disconnect();
                        }
                    } catch (wsError) {
                        console.warn('WebSocket disconnect error:', wsError);
                    }

                    alert('⚠️ Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                    window.location.replace('/login');
                }
            });

            logTokenInfo();

            const userName = user?.displayName || email;
            alert(`Đăng nhập thành công! Chào mừng ${userName}`);

            console.log('📢 Dispatching login event...');
            window.dispatchEvent(new Event('login'));

            console.log('Đang chuyển hướng đến /home...');
            navigate('/home', { replace: true });

        } catch (error) {
            console.error('Lỗi đăng nhập:', error);

            let errorMessage = 'Đăng nhập thất bại. Vui lòng thử lại.';

            if (error.response && error.response.data) {
                errorMessage = error.response.data.message || error.response.data || errorMessage;
            } else if (error.message) {
                errorMessage = error.message;
            }

            if (errorMessage.includes('đã bị xóa trong hệ thống') || errorMessage.includes('liên hệ admin')) {
                alert('⚠️ ' + errorMessage);
            } else {
                setError(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-main">
            {/* Phần bên trái - Logo */}
            <div className="auth-left">
                {/*<img src={image} alt="Social Map" />*/}
                <img src={SocialMapLogo} alt="Social Map" />
            </div>

            {/* Phần bên phải - Form đăng nhập */}
            <div className="auth-right">
                <div className="auth-right-container">

                    <div className="auth-center">
                        <h2>Chào mừng trở lại!</h2>
                        <p>Vui lòng nhập thông tin của bạn</p>

                        <form className="auth-form" onSubmit={handleSubmit}>
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />

                            <div className="pass-input-div">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Mật khẩu"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                {showPassword ? (
                                    <FaEyeSlash onClick={() => setShowPassword(!showPassword)} />
                                ) : (
                                    <FaEye onClick={() => setShowPassword(!showPassword)} />
                                )}
                            </div>

                            {error && <div className="auth-error">{error}</div>}

                            <div className="auth-center-options">
                                <div className="remember-div">
                                    <input type="checkbox" id="remember-checkbox" />
                                    <label htmlFor="remember-checkbox">
                                        Ghi nhớ 30 ngày
                                    </label>
                                </div>
                                <button type="button" className="forgot-pass-link" onClick={() => navigate('/forgot-password')}>
                                    Quên mật khẩu?
                                </button>
                            </div>

                            <div className="auth-center-buttons">
                                <button type="submit" disabled={loading}>
                                    {loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
                                </button>
                                <button type="button" className="google-btn">
                                    <img src={GoogleSvg} alt="Google" />
                                    Đăng nhập với Google
                                </button>
                            </div>
                        </form>
                    </div>

                    <p className="auth-bottom-p">
                        Chưa có tài khoản? <button onClick={() => navigate('/register')}>Đăng ký</button>
                    </p>
                </div>
            </div>
        </div>
    );
}
