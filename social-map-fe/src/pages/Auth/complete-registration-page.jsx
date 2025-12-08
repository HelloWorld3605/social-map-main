import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaEye, FaEyeSlash } from "react-icons/fa6";
import { completeRegistration } from '../../services/authService';
import './auth.css';

// Import logo
import SocialMapLogo from '/image/Social Map.svg';

export default function CompleteRegistrationPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [displayName, setDisplayName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!displayName || !password || !confirmPassword) {
            setError('Vui lòng điền đầy đủ thông tin.');
            return;
        }

        if (displayName.length > 20) {
            setError('Tên hiển thị không được vượt quá 20 ký tự.');
            return;
        }

        if (password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự.');
            return;
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
        if (!passwordRegex.test(password)) {
            setError('Mật khẩu phải có ít nhất 1 ký tự viết hoa, 1 ký tự viết thường và 1 chữ số.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp.');
            return;
        }

        const token = searchParams.get('token');
        if (!token) {
            setError('Không tìm thấy token xác thực.');
            return;
        }

        setError('');
        setLoading(true);

        try {
            console.log('Đang hoàn tất đăng ký:', { displayName, token });

            const response = await completeRegistration({
                verificationToken: token,
                password: password,
                displayName: displayName
            });

            console.log('Đăng ký hoàn tất:', response);
            alert(`Đăng ký thành công! Chào mừng ${displayName}`);
            navigate('/login');

        } catch (error) {
            console.error('Lỗi hoàn tất đăng ký:', error);

            if (error.response && error.response.data && error.response.data.message) {
                setError(error.response.data.message);
            } else if (error.message) {
                setError(error.message);
            } else {
                setError('Đã xảy ra lỗi khi hoàn tất đăng ký. Vui lòng thử lại.');
            }
        } finally {
            setLoading(false);
        }
    };

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
                        <h2>Hoàn tất đăng ký</h2>
                        <p>Chỉ còn một bước nữa!</p>

                        <form className="auth-form" onSubmit={handleSubmit}>
                            <input
                                type="text"
                                placeholder="Tên hiển thị"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                maxLength={20}
                                required
                            />
                            <p className="input-hint">Tối đa 20 ký tự</p>

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
                            <p className="input-hint">Tối thiểu 6 ký tự, 1 chữ hoa, 1 chữ thường, 1 số</p>

                            <div className="pass-input-div">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Xác nhận mật khẩu"
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
                                    {loading ? 'Đang xử lý...' : 'Hoàn tất đăng ký'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
