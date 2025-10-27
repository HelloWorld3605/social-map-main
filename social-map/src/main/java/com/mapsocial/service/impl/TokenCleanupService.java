package com.mapsocial.service.impl;

import com.mapsocial.repository.PendingRegistrationRepository;
import com.mapsocial.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class TokenCleanupService {

    private final PendingRegistrationRepository pendingRegistrationRepository;
    private final UserRepository userRepository;

    /**
     * Dọn dẹp các token hết hạn mỗi giờ
     */
    @Scheduled(fixedRate = 3600000) // 1 giờ
    @Transactional
    public void cleanupExpiredTokens() {
        LocalDateTime now = LocalDateTime.now();

        try {
            // Xóa pending registrations hết hạn
            pendingRegistrationRepository.deleteByExpiresAtBefore(now);

            // Xóa email verification tokens hết hạn
            userRepository.deleteByEmailVerificationExpiresAtBefore(now);

            log.info("Cleanup expired tokens completed at {}", now);
        } catch (Exception e) {
            log.error("Error cleaning up expired tokens: {}", e.getMessage(), e);
        }
    }
}
