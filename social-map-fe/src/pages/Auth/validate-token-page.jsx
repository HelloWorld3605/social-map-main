import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { validateRegistrationToken } from '../../services/authService';

export default function ValidateTokenPage() {
    const navigate = useNavigate();
    const { token } = useParams(); // Lấy token từ URL parameter thay vì query string
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

                // Chuyển hướng đến trang hoàn tất đăng ký sau 2 giây
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
        <div className="flex items-center justify-center min-h-screen bg-gray-100 font-sans">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg text-center">
                {status === 'validating' && (
                    <>
                        <div className="flex justify-center mb-4">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800">Đang xác thực...</h1>
                        <p className="text-gray-600">Vui lòng đợi trong giây lát</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="flex justify-center mb-4">
                            <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800">Xác thực thành công!</h1>
                        <p className="text-gray-600">
                            Đang chuyển hướng đến trang hoàn tất đăng ký...
                        </p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="flex justify-center mb-4">
                            <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800">Xác thực thất bại</h1>
                        <p className="text-red-500">{error}</p>
                        <div className="pt-4">
                            <button
                                onClick={() => navigate('/register')}
                                className="w-full px-4 py-2 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-300"
                            >
                                Đăng ký lại
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
