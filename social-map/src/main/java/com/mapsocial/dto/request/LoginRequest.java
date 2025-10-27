package com.mapsocial.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Schema(description = "Request object để đăng nhập")
public class LoginRequest {

    @Email(message = "Email không hợp lệ")
    @NotBlank(message = "Email là bắt buộc")
    @Schema(description = "Email của người dùng", example = "user@example.com")
    private String email;

    @NotBlank(message = "Password là bắt buộc")
    @Schema(description = "Mật khẩu của người dùng", example = "password123")
    private String password;
}
