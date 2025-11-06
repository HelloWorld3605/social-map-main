package com.mapsocial.controller;

import com.mapsocial.dto.request.*;
import com.mapsocial.dto.response.LoginResponse;
import com.mapsocial.dto.response.user.UserResponse;
import com.mapsocial.service.AuthService;
import com.mapsocial.service.impl.CustomUserDetailsService.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "API xác thực người dùng")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/start-registration")
    @Operation(summary = "Bắt đầu đăng ký bằng email", description = "Bước 1: Gửi email xác thực để bắt đầu quá trình đăng ký")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Email xác thực đã được gửi"),
            @ApiResponse(responseCode = "400", description = "Email không hợp lệ"),
            @ApiResponse(responseCode = "409", description = "Email đã được đăng ký")
    })
    public ResponseEntity<String> startRegistration(@Valid @RequestBody EmailRegistrationRequest request) {
        try {
            String message = authService.startRegistration(request);
            return ResponseEntity.ok(message);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/validate-token/{token}")
    @Operation(summary = "Kiểm tra tính hợp lệ của token đăng ký", description = "Endpoint để xác thực token từ email")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Token hợp lệ"),
            @ApiResponse(responseCode = "400", description = "Token không hợp lệ hoặc đã hết hạn")
    })
    public ResponseEntity<String> validateRegistrationToken(@PathVariable String token) {
        try {
            boolean isValid = authService.validateRegistrationToken(token);
            if (isValid) {
                return ResponseEntity.ok("Token hợp lệ. Bạn có thể hoàn tất đăng ký.");
            } else {
                return ResponseEntity.badRequest().body("Token không hợp lệ hoặc đã hết hạn.");
            }
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/complete-registration")
    @Operation(summary = "Hoàn tất đăng ký", description = "Bước 2: Hoàn tất đăng ký sau khi xác thực email")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Đăng ký thành công"),
            @ApiResponse(responseCode = "400", description = "Token không hợp lệ hoặc dữ liệu không đúng"),
            @ApiResponse(responseCode = "409", description = "Email đã được đăng ký")
    })
    public ResponseEntity<?> completeRegistration(@Valid @RequestBody CompleteRegistrationRequest request) {
        try {
            UserResponse userResponse = authService.completeRegistration(request);
            return ResponseEntity.ok(userResponse);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập", description = "Xác thực người dùng bằng email và mật khẩu, trả về JWT token")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Đăng nhập thành công"),
            @ApiResponse(responseCode = "400", description = "Dữ liệu đầu vào không hợp lệ"),
            @ApiResponse(responseCode = "401", description = "Email hoặc mật khẩu không đúng")
    })
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        try {
            LoginResponse loginResponse = authService.login(request);

            // Lưu refresh token vào HttpOnly cookie
            Cookie refreshTokenCookie = new Cookie("refreshToken", loginResponse.getRefreshToken());
            refreshTokenCookie.setHttpOnly(true);
            refreshTokenCookie.setSecure(false); // Set true khi dùng HTTPS
            refreshTokenCookie.setPath("/");
            refreshTokenCookie.setMaxAge(30 * 24 * 60 * 60); // 30 ngày
            response.addCookie(refreshTokenCookie);

            // Không trả refresh token trong response body để bảo mật
            loginResponse.setRefreshToken(null);

            return ResponseEntity.ok(loginResponse);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/refresh")
    @Operation(summary = "Làm mới access token", description = "Sử dụng refresh token để lấy access token mới")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Làm mới token thành công"),
            @ApiResponse(responseCode = "401", description = "Refresh token không hợp lệ hoặc đã hết hạn")
    })
    public ResponseEntity<?> refreshToken(@CookieValue(name = "refreshToken", required = false) String refreshToken) {
        try {
            if (refreshToken == null || refreshToken.isEmpty()) {
                return ResponseEntity.status(401).body("Refresh token không tồn tại");
            }

            LoginResponse loginResponse = authService.refreshAccessToken(refreshToken);

            // Không trả refresh token trong response body
            loginResponse.setRefreshToken(null);

            return ResponseEntity.ok(loginResponse);
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(e.getMessage());
        }
    }

    @PostMapping("/logout")
    @Operation(summary = "Đăng xuất", description = "Đăng xuất người dùng và vô hiệu hóa JWT token")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Đăng xuất thành công"),
            @ApiResponse(responseCode = "401", description = "Token không hợp lệ hoặc đã hết hạn")
    })
    public ResponseEntity<String> logout(@RequestHeader("Authorization") String authHeader) {
        try {
            String message = authService.logout(authHeader);
            return ResponseEntity.ok(message);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/change-password")
    @Operation(summary = "Đổi mật khẩu", description = "Người dùng đổi mật khẩu sau khi đăng nhập")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Đổi mật khẩu thành công"),
            @ApiResponse(responseCode = "400", description = "Mật khẩu cũ không đúng"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy người dùng")
    })
    public ResponseEntity<String> changePassword(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody ChangePasswordRequest request) {
        try {
            UUID userId = userPrincipal.getUser().getId();
            authService.changePassword(userId, request);
            return ResponseEntity.ok("Đổi mật khẩu thành công");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/verify-email/{token}")
    @Operation(summary = "Xác thực email", description = "Endpoint để xác thực email người dùng")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Xác thực email thành công"),
            @ApiResponse(responseCode = "400", description = "Token không hợp lệ hoặc đã hết hạn")
    })
    public ResponseEntity<String> verifyEmail(@PathVariable String token) {
        try {
            String result = authService.verifyEmail(token);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/resend-verification")
    @Operation(summary = "Gửi lại email xác thực", description = "Gửi lại email xác thực cho người dùng chưa xác thực")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Email xác thực đã được gửi lại"),
            @ApiResponse(responseCode = "400", description = "Email không tồn tại hoặc đã xác thực"),
            @ApiResponse(responseCode = "500", description = "Lỗi gửi email")
    })
    public ResponseEntity<String> resendEmailVerification(@RequestParam String email) {
        try {
            authService.resendEmailVerification(email);
            return ResponseEntity.ok("Email xác thực đã được gửi lại thành công!");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
