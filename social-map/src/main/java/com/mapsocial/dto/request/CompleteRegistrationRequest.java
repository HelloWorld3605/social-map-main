package com.mapsocial.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(description = "Request object để hoàn tất đăng ký sau khi xác thực email")
public class CompleteRegistrationRequest {

    @NotBlank(message = "Token xác thực là bắt buộc")
    @Schema(description = "Token xác thực email", example = "abc123-def456-ghi789")
    private String verificationToken;

    @NotBlank(message = "Password là bắt buộc")
    @Size(min = 6, message = "Password phải có ít nhất 6 ký tự")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{6,}$",
        message = "Password phải có ít nhất 6 ký tự, ít nhất 1 ký tự viết hoa, 1 ký tự viết thường và 1 chữ số"
    )
    @Schema(description = "Mật khẩu (tối thiểu 6 ký tự, ít nhất 1 ký tự viết hoa, 1 ký tự viết thường, 1 chữ số)", example = "Password123")
    private String password;

    @NotBlank(message = "Display name là bắt buộc")
    @Size(max = 20, message = "Display name không được vượt quá 20 ký tự")
    @Schema(description = "Tên hiển thị (tối đa 20 ký tự)", example = "John Doe")
    private String displayName;
}
