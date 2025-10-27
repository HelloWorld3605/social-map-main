package com.mapsocial.service.impl;

import com.mapsocial.dto.request.*;
import com.mapsocial.dto.response.LoginResponse;
import com.mapsocial.dto.response.user.UserResponse;
import com.mapsocial.entity.PendingRegistration;
import com.mapsocial.entity.User;
import com.mapsocial.enums.UserRole;
import com.mapsocial.mapper.UserMapper;
import com.mapsocial.repository.PendingRegistrationRepository;
import com.mapsocial.repository.UserRepository;
import com.mapsocial.service.AuthService;
import com.mapsocial.service.email.EmailService;
import com.mapsocial.util.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    private final EmailService emailService;
    private final UserRepository userRepository;
    private final PendingRegistrationRepository pendingRegistrationRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;
    private final JwtUtils jwtUtils;

    @Value("${jwt.expiration:86400000}")
    private long jwtExpiration;

    @Value("${app.verification.token.expiration:900000}") // 15 phút
    private long verificationTokenExpiration;

    // ----------------- START REGISTRATION -----------------
    @Override
    @Transactional
    public String startRegistration(EmailRegistrationRequest request) {
        // Kiểm tra email đã tồn tại chưa
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email đã được sử dụng");
        }

        // Xóa pending registration cũ nếu có (không cần kiểm tra hết hạn)
        Optional<PendingRegistration> existingPending = pendingRegistrationRepository.findByEmail(request.getEmail());
        if (existingPending.isPresent()) {
            pendingRegistrationRepository.delete(existingPending.get());
            pendingRegistrationRepository.flush(); // Đảm bảo xóa ngay lập tức
        }

        // Tạo token xác thực mới
        String verificationToken = UUID.randomUUID().toString();

        // Tạo pending registration mới
        PendingRegistration pendingRegistration = PendingRegistration.builder()
                .email(request.getEmail())
                .verificationToken(verificationToken)
                .expiresAt(LocalDateTime.now().plusSeconds(verificationTokenExpiration / 1000))
                .build();

        try {
            pendingRegistrationRepository.save(pendingRegistration);

            // Gửi email xác thực
            emailService.sendRegistrationVerification(request.getEmail(), verificationToken);

            return "Email xác thực đã được gửi đến " + request.getEmail();

        } catch (Exception e) {
            // Nếu có lỗi khi gửi email, xóa pending registration vừa tạo
            pendingRegistrationRepository.delete(pendingRegistration);
            throw new RuntimeException("Không thể gửi email xác thực: " + e.getMessage());
        }
    }

    // ----------------- VALIDATE TOKEN -----------------
    @Override
    public boolean validateRegistrationToken(String token) {
        Optional<PendingRegistration> pendingOpt = pendingRegistrationRepository.findByVerificationToken(token);
        if (pendingOpt.isEmpty()) return false;

        PendingRegistration pending = pendingOpt.get();
        return pending.getExpiresAt().isAfter(LocalDateTime.now());
    }

    // ----------------- COMPLETE REGISTRATION -----------------
    @Override
    @Transactional
    public UserResponse completeRegistration(CompleteRegistrationRequest request) {
        PendingRegistration pending = pendingRegistrationRepository
                .findByVerificationToken(request.getVerificationToken())
                .orElseThrow(() -> new RuntimeException("Token xác thực không hợp lệ"));

        if (pending.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Token xác thực đã hết hạn");
        }

        if (userRepository.findByEmail(pending.getEmail()).isPresent()) {
            throw new RuntimeException("Email đã được sử dụng");
        }

        User user = User.builder()
                .email(pending.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .displayName(request.getDisplayName())
                .role(UserRole.USER)
                .isEmailVerified(true)
                .build();

        User savedUser = userRepository.save(user);

        pendingRegistrationRepository.delete(pending);

        return userMapper.toUserResponse(savedUser);
    }

    // ----------------- LOGIN -----------------
    @Override
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Email hoặc mật khẩu không đúng"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Email hoặc mật khẩu không đúng");
        }

        // ✅ Sử dụng generateToken(User) để thêm userId vào JWT token
        String accessToken = jwtUtils.generateToken(user);

        return LoginResponse.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .expiresIn(jwtExpiration)
                .user(userMapper.toUserResponse(user))
                .build();
    }

    // ----------------- LOGOUT -----------------
    @Override
    public String logout(String authHeader) {
        return "Đăng xuất thành công";
    }

    // ----------------- CHANGE PASSWORD -----------------
    @Override
    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Mật khẩu hiện tại không đúng");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    // ----------------- VERIFY EMAIL -----------------
    @Override
    @Transactional
    public String verifyEmail(String token) {
        User user = userRepository.findByEmailVerificationToken(token)
                .orElseThrow(() -> new RuntimeException("Token xác thực không hợp lệ"));

        if (user.getEmailVerificationExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Token xác thực đã hết hạn");
        }

        user.setIsEmailVerified(true);
        user.setEmailVerificationToken(null);
        user.setEmailVerificationExpiresAt(null);
        userRepository.save(user);

        return "Email đã được xác thực thành công";
    }

    // ----------------- RESEND EMAIL VERIFICATION -----------------
    @Override
    @Transactional
    public void resendEmailVerification(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với email này"));

        if (user.getIsEmailVerified()) {
            throw new RuntimeException("Email đã được xác thực rồi");
        }

        String newToken = UUID.randomUUID().toString();
        user.setEmailVerificationToken(newToken);
        user.setEmailVerificationExpiresAt(LocalDateTime.now().plusHours(24));
        userRepository.save(user);

        try {
            emailService.sendEmailVerification(user, newToken);
        } catch (Exception e) {
            throw new RuntimeException("Không thể gửi email xác thực: " + e.getMessage());
        }
    }
}
