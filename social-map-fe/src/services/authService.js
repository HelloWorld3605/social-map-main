import { api } from './apiClient';

// 1. Bắt đầu đăng ký (gửi email xác thực)
export const startRegistration = async (data) => {
  // data = { email }
  return await api.post('/auth/start-registration', data);
};

// 2. Kiểm tra token hợp lệ (validate token)
export const validateRegistrationToken = async (token) => {
  return await api.get(`/auth/validate-token/${token}`);
};

// 3. Hoàn tất đăng ký
export const completeRegistration = async (data) => {
  // data = { verificationToken, password, displayName }
  return await api.post('/auth/complete-registration', data);
};

// 4. Đăng nhập
export const login = async (data) => {
  // data = { email, password }
  return await api.post('/auth/login', data);
};

// 5. Đăng xuất
export const logout = async (data = {}) => {
  // data = {} (BE cần token từ header)
  return await api.post('/auth/logout', data);
};

// 6. Đổi mật khẩu (dựa vào JWT)
export const changePassword = async (data) => {
  // data = { currentPassword, newPassword }
  return await api.post('/auth/change-password', data);
};

// 7. Xác thực email
export const verifyEmail = async (token) => {
  return await api.get(`/auth/verify-email/${token}`);
};

// 8. Gửi lại email xác thực
export const resendEmailVerification = async (email) => {
  // email: string
  return await api.post('/auth/resend-verification', null, {
    params: { email }
  });
};
