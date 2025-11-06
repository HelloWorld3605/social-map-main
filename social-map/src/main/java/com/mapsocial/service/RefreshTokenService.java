package com.mapsocial.service;

import com.mapsocial.entity.RefreshToken;
import com.mapsocial.entity.User;

import java.util.Optional;

public interface RefreshTokenService {
    /**
     * Tạo refresh token mới cho user
     */
    RefreshToken createRefreshToken(User user, String deviceInfo);

    /**
     * Xác thực và lấy refresh token
     */
    Optional<RefreshToken> findByToken(String token);

    /**
     * Xác thực refresh token
     */
    RefreshToken verifyExpiration(RefreshToken token);

    /**
     * Thu hồi tất cả refresh token của user
     */
    void revokeAllUserTokens(User user);

    /**
     * Xóa các token đã hết hạn
     */
    void deleteExpiredTokens();

    /**
     * Xóa refresh token cụ thể
     */
    void deleteByToken(String token);
}

