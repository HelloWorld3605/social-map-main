import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { forgotPassword } from '../../services/authService';
import './auth.css';

// Import logo
import SocialMapLogo from '/image/Social Map.svg';

export default function ForgotPasswordPage() {
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
            console.log('Đang gửi yêu cầu đặt lại mật khẩu với email:', email);

            await forgotPassword(email);

            console.log('Gửi email thành công');
            setSuccess(true);

        } catch (error) {
            console.error('Lỗi gửi email đặt lại mật khẩu:', error);

            if (error.response && error.response.data && error.response.data.message) {
                setError(error.response.data.message);
            } else if (error.message) {
                setError(error.message);
            } else {
                setError('Đã xảy ra lỗi. Vui lòng thử lại.');
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
                        <div className="auth-logo">
                            <img src={SocialMapLogo} alt="Social Map" />
                        </div>

                        <div className="auth-center auth-success-container">
                            <svg className="auth-success-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>

                            <h2>Kiểm tra email của bạn!</h2>

                            <p>
                                Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến <span className="email-highlight">{email}</span>
                            </p>

                            <p style={{ fontSize: '0.9rem', color: '#888' }}>
                                Vui lòng kiểm tra hộp thư (bao gồm thư mục spam) và nhấp vào liên kết để đặt lại mật khẩu.
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
                    <div className="auth-logo">
                        <img src={SocialMapLogo} alt="Social Map" />
                    </div>

                    <div className="auth-center">
                        <h2>Quên mật khẩu?</h2>
                        <p>Nhập email để nhận hướng dẫn đặt lại mật khẩu</p>

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
                                    {loading ? 'Đang gửi...' : 'Gửi email đặt lại'}
                                </button>
                            </div>
                        </form>
                    </div>

                    <p className="auth-bottom-p">
                        Đã nhớ mật khẩu? <button onClick={() => navigate('/login')}>Đăng nhập</button>
                    </p>
                </div>
            </div>
        </div>
    );
}

