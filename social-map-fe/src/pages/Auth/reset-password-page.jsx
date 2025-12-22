import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FaEye, FaEyeSlash } from "react-icons/fa6";
import { validateResetToken, resetPassword } from '../../services/authService';
import './auth.css';

// Import logo
import SocialMapLogo from '/image/Social Map.svg';

export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const { token: paramToken } = useParams();
    const [searchParams] = useSearchParams();

    // Lấy token từ URL params hoặc query string
    const token = paramToken || searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [validating, setValidating] = useState(true);
    const [tokenValid, setTokenValid] = useState(false);
    const [success, setSuccess] = useState(false);

    // Validate token khi component mount
    useEffect(() => {
        const checkToken = async () => {
            if (!token) {
                setValidating(false);
                setError('Không tìm thấy token đặt lại mật khẩu.');
                return;
            }

            try {
                console.log('Đang xác thực token:', token);
                await validateResetToken(token);
                console.log('Token hợp lệ');
                setTokenValid(true);
            } catch (error) {
                console.error('Token không hợp lệ:', error);
                if (error.response && error.response.data && error.response.data.message) {
                    setError(error.response.data.message);
                } else {
                    setError('Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
                }
            } finally {
                setValidating(false);
            }
        };

        checkToken();
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!password || !confirmPassword) {
            setError('Vui lòng điền đầy đủ thông tin.');
            return;
        }

        if (password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự.');
            return;
        }

        // Password phải có ít nhất 1 ký tự viết hoa, 1 ký tự viết thường và 1 chữ số
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
        if (!passwordRegex.test(password)) {
            setError('Mật khẩu phải có ít nhất 1 ký tự viết hoa, 1 ký tự viết thường và 1 chữ số.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp.');
            return;
        }

        setError('');
        setLoading(true);

        try {
            console.log('Đang đặt lại mật khẩu...');

            await resetPassword({
                token: token,
                newPassword: password
            });

            console.log('Đặt lại mật khẩu thành công');
            setSuccess(true);

        } catch (error) {
            console.error('Lỗi đặt lại mật khẩu:', error);

            if (error.response && error.response.data && error.response.data.message) {
                setError(error.response.data.message);
            } else if (error.message) {
                setError(error.message);
            } else {
                setError('Đã xảy ra lỗi khi đặt lại mật khẩu. Vui lòng thử lại.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Loading state - đang validate token
    if (validating) {
        return (
            <div className="auth-main">
                <div className="auth-left">
                    <img src={SocialMapLogo} alt="Social Map" />
                </div>

                <div className="auth-right">
                    <div className="auth-right-container">

                        <div className="auth-center">
                            <div className="auth-loading-container">
                                <div className="auth-spinner"></div>
                                <h2>Đang xác thực...</h2>
                                <p>Vui lòng đợi trong giây lát</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Token không hợp lệ
    if (!tokenValid && !validating) {
        return (
            <div className="auth-main">
                <div className="auth-left">
                    <img src={SocialMapLogo} alt="Social Map" />
                </div>

                <div className="auth-right">
                    <div className="auth-right-container">

                        <div className="auth-center auth-success-container">
                            <svg className="auth-error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h2>Link không hợp lệ</h2>
                            <p style={{ color: '#dc2626' }}>{error}</p>

                            <div className="auth-center-buttons">
                                <button type="button" onClick={() => navigate('/forgot-password')}>
                                    Yêu cầu link mới
                                </button>
                            </div>
                        </div>

                        <p className="auth-bottom-p">
                            <button onClick={() => navigate('/login')}>Về trang đăng nhập</button>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Đặt lại mật khẩu thành công
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

                            <h2>Đặt lại mật khẩu thành công!</h2>

                            <p>
                                Mật khẩu của bạn đã được cập nhật. Bây giờ bạn có thể đăng nhập với mật khẩu mới.
                            </p>

                            <div className="auth-center-buttons">
                                <button type="button" onClick={() => navigate('/login')}>
                                    Đăng nhập ngay
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Form đặt lại mật khẩu
    return (
        <div className="auth-main">
            <div className="auth-left">
                <img src={SocialMapLogo} alt="Social Map" />
            </div>

            <div className="auth-right">
                <div className="auth-right-container">

                    <div className="auth-center">
                        <h2>Đặt lại mật khẩu</h2>
                        <p>Nhập mật khẩu mới của bạn</p>

                        <form className="auth-form" onSubmit={handleSubmit}>
                            <div className="pass-input-div">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Mật khẩu mới"
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
                            <p className="input-hint">Tối thiểu 6 ký tự, 1 chữ hoa, 1 chữ thường, 1 số</p>

                            <div className="pass-input-div">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Xác nhận mật khẩu mới"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                                {showConfirmPassword ? (
                                    <FaEyeSlash onClick={() => setShowConfirmPassword(!showConfirmPassword)} />
                                ) : (
                                    <FaEye onClick={() => setShowConfirmPassword(!showConfirmPassword)} />
                                )}
                            </div>

                            {error && <div className="auth-error">{error}</div>}

                            <div className="auth-center-buttons">
                                <button type="submit" disabled={loading}>
                                    {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                                </button>
                            </div>
                        </form>
                    </div>

                    <p className="auth-bottom-p">
                        <button onClick={() => navigate('/login')}>Về trang đăng nhập</button>
                    </p>
                </div>
            </div>
        </div>
    );
}

