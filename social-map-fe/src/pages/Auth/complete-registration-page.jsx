import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { completeRegistration } from '../../services/authService';

export default function CompleteRegistrationPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [displayName, setDisplayName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation theo backend
        if (!displayName || !password || !confirmPassword) {
            setError('Vui lòng điền đầy đủ thông tin.');
            return;
        }

        // Display name không được vượt quá 20 ký tự
        if (displayName.length > 20) {
            setError('Tên hiển thị không được vượt quá 20 ký tự.');
            return;
        }

        // Password phải có ít nhất 6 ký tự
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

            // Hiển thị thông báo thành công
            alert(`Đăng ký thành công! Chào mừng ${displayName}`);

            // Chuyển hướng về trang đăng nhập
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
        <div className="flex items-center justify-center min-h-screen bg-gray-100 font-sans">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-800">Hoàn tất đăng ký</h1>
                    <p className="mt-2 text-sm text-gray-600">Chỉ còn một bước nữa!</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Tên hiển thị */}
                    <div>
                        <label
                            htmlFor="displayName"
                            className="text-sm font-semibold text-gray-700 block mb-2"
                        >
                            Tên hiển thị
                        </label>
                        <input
                            type="text"
                            id="displayName"
                            name="displayName"
                            placeholder="Nguyễn Văn A"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            maxLength={20}
                            className="w-full px-4 py-2 text-gray-700 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                        <p className="mt-1 text-xs text-gray-500">Tối đa 20 ký tự</p>
                    </div>

                    {/* Mật khẩu */}
                    <div>
                        <label
                            htmlFor="password"
                            className="text-sm font-semibold text-gray-700 block mb-2"
                        >
                            Mật khẩu
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            placeholder="Password123"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 text-gray-700 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Tối thiểu 6 ký tự, ít nhất 1 ký tự viết hoa, 1 ký tự viết thường và 1 chữ số
                        </p>
                    </div>

                    {/* Xác nhận mật khẩu */}
                    <div>
                        <label
                            htmlFor="confirmPassword"
                            className="text-sm font-semibold text-gray-700 block mb-2"
                        >
                            Xác nhận mật khẩu
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
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
                            {loading ? 'Đang xử lý...' : 'Hoàn tất đăng ký'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
