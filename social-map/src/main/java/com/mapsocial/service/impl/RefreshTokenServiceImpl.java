package com.mapsocial.service.impl;

import com.mapsocial.entity.RefreshToken;
import com.mapsocial.entity.User;
import com.mapsocial.repository.RefreshTokenRepository;
import com.mapsocial.service.RefreshTokenService;
import com.mapsocial.util.JwtUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenServiceImpl implements RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtUtils jwtUtils;

    @Override
    @Transactional
    public RefreshToken createRefreshToken(User user, String deviceInfo) {
        // Tạo JWT refresh token
        String tokenString = jwtUtils.generateRefreshToken(user);

        // Tính thời gian hết hạn
        LocalDateTime expiryDate = LocalDateTime.now()
                .plusSeconds(jwtUtils.getRefreshTokenExpiration() / 1000);

        // Tạo entity RefreshToken
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(tokenString)
                .expiryDate(expiryDate)
                .deviceInfo(deviceInfo)
                .build();

        return refreshTokenRepository.save(refreshToken);
    }

    @Override
    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepository.findByToken(token);
    }

    @Override
    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.isExpired()) {
            refreshTokenRepository.delete(token);
            throw new RuntimeException("Refresh token đã hết hạn. Vui lòng đăng nhập lại.");
        }

        if (token.isRevoked()) {
            throw new RuntimeException("Refresh token đã bị thu hồi. Vui lòng đăng nhập lại.");
        }

        return token;
    }

    @Override
    @Transactional
    public void revokeAllUserTokens(User user) {
        refreshTokenRepository.revokeAllUserTokens(user.getId(), LocalDateTime.now());
    }

    @Override
    @Transactional
    public void deleteExpiredTokens() {
        refreshTokenRepository.deleteExpiredTokens(LocalDateTime.now());
        log.info("Đã xóa các refresh token hết hạn");
    }

    @Override
    @Transactional
    public void deleteByToken(String token) {
        refreshTokenRepository.findByToken(token).ifPresent(refreshTokenRepository::delete);
    }
}

