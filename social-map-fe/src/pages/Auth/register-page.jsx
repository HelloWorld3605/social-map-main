import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { startRegistration } from '../../services/authService';

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
            <div className="flex items-center justify-center min-h-screen bg-gray-100 font-sans">
                <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg text-center">
                    <div className="flex justify-center mb-4">
                        <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>

                    <h1 className="text-2xl font-bold text-gray-800">Kiểm tra email của bạn!</h1>

                    <p className="text-gray-600">
                        Chúng tôi đã gửi một email xác thực đến <strong>{email}</strong>
                    </p>

                    <p className="text-sm text-gray-500">
                        Vui lòng kiểm tra hộp thư và nhấp vào liên kết để hoàn tất đăng ký.
                    </p>

                    <div className="pt-4">
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full px-4 py-2 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-300"
                        >
                            Về trang đăng nhập
                        </button>
                    </div>

                    <p className="text-sm text-gray-600">
                        Không nhận được email?{' '}
                        <button
                            onClick={() => setSuccess(false)}
                            className="font-semibold text-blue-600 hover:underline"
                        >
                            Gửi lại
                        </button>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 font-sans">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-800">Đăng Ký</h1>
                    <p className="mt-2 text-sm text-gray-600">Tạo tài khoản mới để bắt đầu</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label
                            htmlFor="email"
                            className="text-sm font-semibold text-gray-700 block mb-2"
                        >
                            Địa chỉ Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 text-gray-700 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>

                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full px-4 py-2 font-bold text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-300 ${loading
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                        >
                            {loading ? 'Đang gửi...' : 'Đăng Ký'}
                        </button>
                    </div>
                </form>

                <p className="text-sm text-center text-gray-600">
                    Đã có tài khoản?{' '}
                    <button
                        onClick={() => navigate('/login')}
                        className="font-semibold text-blue-600 hover:underline"
                    >
                        Đăng nhập ngay
                    </button>
                </p>
            </div>
        </div>
    );
}
