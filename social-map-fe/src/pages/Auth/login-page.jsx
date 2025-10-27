import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../services/authService';

// Đây là thành phần trang đăng nhập
export default function LoginPage() {
    const navigate = useNavigate();
    // Sử dụng state để lưu trữ email và mật khẩu người dùng nhập vào
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Hàm xử lý khi người dùng nhấn nút đăng nhập
    const handleSubmit = async (e) => {
        e.preventDefault(); // Ngăn trình duyệt tải lại trang

        // Kiểm tra đơn giản
        if (!email || !password) {
            setError('Vui lòng nhập cả email và mật khẩu.');
            return;
        }

        // Xóa lỗi nếu đã điền đủ
        setError('');
        setLoading(true);

        // 🔥 CHỨC NĂNG TEST: Nếu email là "test@test.com", bypass API
        if (email === 'test@test.com') {
            console.log('🧪 Chế độ test - Bypass API');
            localStorage.setItem('authToken', 'fake-token-for-testing');
            alert(`Đăng nhập test thành công! Chào mừng ${email}`);
            setLoading(false);
            navigate('/home', { replace: true });
            return;
        }

        try {
            // Gọi API đăng nhập
            console.log('Đang thử đăng nhập với:', { email, password });

            const response = await login({ email, password });

            // Xử lý phản hồi thành công
            console.log('Đăng nhập thành công - Full response:', response);
            console.log('Response.data:', response.data);
            console.log('Response object keys:', Object.keys(response));

            // API response có thể ở response.data hoặc trực tiếp trong response
            const data = response.data || response;
            console.log('Data object:', data);

            // Lưu token - kiểm tra nhiều format khác nhau
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
            }

            // Lưu thông tin user vào localStorage
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

            // Hiển thị thông báo thành công
            const userName = user?.displayName || email;
            alert(`Đăng nhập thành công! Chào mừng ${userName}`);

            // Chuyển hướng đến trang chính (map)
            console.log('Đang chuyển hướng đến /home...');
            navigate('/home', { replace: true });

        } catch (error) {
            // Xử lý lỗi từ API
            console.error('Lỗi đăng nhập:', error);

            if (error.response && error.response.data && error.response.data.message) {
                setError(error.response.data.message);
            } else if (error.message) {
                setError(error.message);
            } else {
                setError('Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        // Container chính, căn giữa mọi thứ trên màn hình
        <div className="flex items-center justify-center min-h-screen bg-gray-100 font-sans">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">

                {/* Tiêu đề của form */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-800">Đăng Nhập</h1>
                    <p className="mt-2 text-sm text-gray-600">Chào mừng bạn quay trở lại!</p>
                </div>

                {/* Form đăng nhập */}
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Trường nhập email */}
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

                    {/* Trường nhập mật khẩu */}
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
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 text-gray-700 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>

                    {/* Hiển thị thông báo lỗi nếu có */}
                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                    {/* Các tùy chọn khác như "Quên mật khẩu" */}
                    <div className="flex items-center justify-end">
                        <a href="#" className="text-sm text-blue-600 hover:underline">
                            Quên mật khẩu?
                        </a>
                    </div>

                    {/* Nút Đăng nhập */}
                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full px-4 py-2 font-bold text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-300 ${loading
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                        >
                            {loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
                        </button>
                    </div>
                </form>

                {/* Đường dẫn đến trang đăng ký */}
                <p className="text-sm text-center text-gray-600">
                    Chưa có tài khoản?{' '}
                    <button
                        onClick={() => navigate('/register')}
                        className="font-semibold text-blue-600 hover:underline"
                    >
                        Đăng ký ngay
                    </button>
                </p>
            </div>
        </div>
    );
}
