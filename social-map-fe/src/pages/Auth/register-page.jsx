import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { startRegistration } from '../../services/authService';
import './auth.css';

// Import logo
import SocialMapLogo from '/image/Social Map.svg';
import GoogleSvg from '../../assets/icons8-google.svg';

export default function RegisterPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email) {
            setError('Vui lòng nhập địa chỉ email.');
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Địa chỉ email không hợp lệ.');
            return;
        }

        setError('');
        setLoading(true);

        try {
            console.log('Đang gửi yêu cầu đăng ký với email:', email);

            const response = await startRegistration({ email });

            console.log('Đăng ký thành công:', response);

            // Hiển thị thông báo thành công
            setSuccess(true);

        } catch (error) {
            console.error('Lỗi đăng ký:', error);

            if (error.response && error.response.data && error.response.data.message) {
                setError(error.response.data.message);
            } else if (error.message) {
                setError(error.message);
            } else {
                setError('Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="auth-main">
                <div className="auth-left">
                    <img src={SocialMapLogo} alt="Social Map" />
                </div>

                <div className="auth-right">
                    <div className="auth-right-container">

                        <div className="auth-center auth-success-container">
                            <svg className="auth-success-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>

                            <h2>Kiểm tra email của bạn!</h2>

                            <p>
                                Chúng tôi đã gửi email xác thực đến <span className="email-highlight">{email}</span>
                            </p>

                            <p style={{ fontSize: '0.9rem', color: '#888' }}>
                                Vui lòng kiểm tra hộp thư và nhấp vào liên kết để hoàn tất đăng ký.
                            </p>

                            <div className="auth-center-buttons">
                                <button type="button" onClick={() => navigate('/login')}>
                                    Về trang đăng nhập
                                </button>
                            </div>
                        </div>

                        <p className="auth-bottom-p">
                            Không nhận được email? <button onClick={() => setSuccess(false)}>Gửi lại</button>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-main">
            <div className="auth-left">
                <img src={SocialMapLogo} alt="Social Map" />
            </div>

            <div className="auth-right">
                <div className="auth-right-container">

                    <div className="auth-center">
                        <h2>Tạo tài khoản</h2>
                        <p>Nhập email để bắt đầu đăng ký</p>

                        <form className="auth-form" onSubmit={handleSubmit}>
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />

                            {error && <div className="auth-error">{error}</div>}

                            <div className="auth-center-buttons">
                                <button type="submit" disabled={loading}>
                                    {loading ? 'Đang gửi...' : 'Đăng Ký'}
                                </button>
                                <button type="button" className="google-btn">
                                    <img src={GoogleSvg} alt="Google" />
                                    Đăng ký với Google
                                </button>
                            </div>
                        </form>
                    </div>

                    <p className="auth-bottom-p">
                        Đã có tài khoản? <button onClick={() => navigate('/login')}>Đăng nhập</button>
                    </p>
                </div>
            </div>
        </div>
    );
}
