package com.mapsocial.service.email;

import com.mapsocial.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    // Frontend URL used in emails (React dev server). Default to localhost:5173
    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Override
    public void sendEmailVerification(User user, String verificationToken) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(user.getEmail());
            message.setSubject("Xác thực email - Social Map");

            // Send link to frontend so user clicks and frontend calls backend to verify
            String verificationUrl = frontendUrl + "/verify-email/" + verificationToken;
            String emailContent = String.format(
                    "Chào %s,\n\n" +
                            "Cảm ơn bạn đã đăng ký tài khoản tại Social Map!\n\n" +
                            "Vui lòng nhấp vào liên kết bên dưới để xác thực email của bạn:\n\n" +
                            "%s\n\n" +
                            "Liên kết này sẽ hết hạn sau 24 giờ.\n\n" +
                            "Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.\n\n" +
                            "Trân trọng,\n" +
                            "Đội ngũ Social Map",
                    user.getDisplayName(),
                    verificationUrl
            );

            message.setText(emailContent);
            mailSender.send(message);

            log.info("Email verification sent successfully to: {}", user.getEmail());
        } catch (Exception e) {
            log.error("Failed to send verification email to: {}, error: {}", user.getEmail(), e.getMessage());
            throw new RuntimeException("Không thể gửi email xác thực. Vui lòng thử lại.");
        }
    }

    @Override
    public void sendPasswordResetEmail(String email, String resetToken) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(email);
            message.setSubject("Đặt lại mật khẩu - Social Map");

            // Point to frontend reset page
            String resetUrl = frontendUrl + "/reset-password/" + resetToken;
            String emailContent = String.format(
                    "Chào bạn,\n\n" +
                            "Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản Social Map.\n\n" +
                            "Nhấp vào liên kết bên dưới để đặt lại mật khẩu:\n\n" +
                            "%s\n\n" +
                            "Liên kết này sẽ hết hạn sau 1 giờ.\n\n" +
                            "Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.\n\n" +
                            "Trân trọng,\n" +
                            "Đội ngũ Social Map",
                    resetUrl
            );

            message.setText(emailContent);
            mailSender.send(message);

            log.info("Password reset email sent successfully to: {}", email);
        } catch (Exception e) {
            log.error("Failed to send password reset email to: {}, error: {}", email, e.getMessage());
            throw new RuntimeException("Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại.");
        }
    }

    @Override
    public void sendWelcomeEmail(User user) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(user.getEmail());
            message.setSubject("Chào mừng đến với Social Map!");

            String emailContent = String.format(
                    "Chào %s,\n\n" +
                            "Chào mừng bạn đã gia nhập cộng đồng Social Map!\n\n" +
                            "Email của bạn đã được xác thực thành công.\n" +
                            "Chúc bạn có những trải nghiệm tuyệt vời!\n\n" +
                            "Trân trọng,\n" +
                            "Đội ngũ Social Map",
                    user.getDisplayName()
            );

            message.setText(emailContent);
            mailSender.send(message);

            log.info("Welcome email sent successfully to: {}", user.getEmail());
        } catch (Exception e) {
            log.error("Failed to send welcome email to: {}, error: {}", user.getEmail(), e.getMessage());
        }
    }

    @Override
    public void sendRegistrationVerification(String email, String verificationToken) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(email);
            message.setSubject("Xác thực email để đăng ký - Social Map");

            // Use frontend URL for registration flow
            String verificationUrl = frontendUrl + "/validate-token/" + verificationToken;
            String emailContent = String.format(
                    "Chào bạn,\n\n" +
                            "Cảm ơn bạn đã quan tâm đến Social Map!\n\n" +
                            "Để hoàn tất quá trình đăng ký, vui lòng nhấp vào liên kết bên dưới để xác thực email:\n\n" +
                            "%s\n\n" +
                            "Liên kết này sẽ hết hạn sau 15 phút.\n\n" +
                            "Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.\n\n" +
                            "Trân trọng,\n" +
                            "Đội ngũ Social Map",
                    verificationUrl
            );

            message.setText(emailContent);
            mailSender.send(message);

            log.info("Registration verification email sent successfully to: {}", email);
        } catch (Exception e) {
            log.error("Failed to send registration verification email to: {}, error: {}", email, e.getMessage());
            throw new RuntimeException("Không thể gửi email xác thực. Vui lòng thử lại.");
        }
    }
}
