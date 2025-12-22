import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { validateRegistrationToken } from '../../services/authService';
import './auth.css';

// Import logo
import SocialMapLogo from '/image/Social Map.svg';

export default function ValidateTokenPage() {
    const navigate = useNavigate();
    const { token } = useParams();
    const [status, setStatus] = useState('validating'); // validating, success, error
    const [error, setError] = useState('');

    useEffect(() => {
        const validateToken = async () => {
            if (!token) {
                setStatus('error');
                setError('Không tìm thấy token xác thực.');
                return;
            }

            try {
                console.log('Đang xác thực token:', token);
                const response = await validateRegistrationToken(token);
                console.log('Token hợp lệ:', response);
                setStatus('success');

                setTimeout(() => {
                    navigate(`/complete-registration?token=${token}`);
                }, 2000);

            } catch (error) {
                console.error('Lỗi xác thực token:', error);
                setStatus('error');

                if (error.response && error.response.data && error.response.data.message) {
                    setError(error.response.data.message);
                } else if (error.message) {
                    setError(error.message);
                } else {
                    setError('Token không hợp lệ hoặc đã hết hạn.');
                }
            }
        };

        validateToken();
    }, [token, navigate]);

    return (
        <div className="auth-main">
            <div className="auth-left">
                <img src={SocialMapLogo} alt="Social Map" />
            </div>

            <div className="auth-right">
                <div className="auth-right-container">

                    <div className="auth-center">
                        {status === 'validating' && (
                            <div className="auth-loading-container">
                                <div className="auth-spinner"></div>
                                <h2>Đang xác thực...</h2>
                                <p>Vui lòng đợi trong giây lát</p>
                            </div>
                        )}

                        {status === 'success' && (
                            <div className="auth-success-container">
                                <svg className="auth-success-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <h2>Xác thực thành công!</h2>
                                <p>Đang chuyển hướng đến trang hoàn tất đăng ký...</p>
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="auth-success-container">
                                <svg className="auth-error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <h2>Xác thực thất bại</h2>
                                <p style={{ color: '#dc2626' }}>{error}</p>

                                <div className="auth-center-buttons">
                                    <button type="button" onClick={() => navigate('/register')}>
                                        Đăng ký lại
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
