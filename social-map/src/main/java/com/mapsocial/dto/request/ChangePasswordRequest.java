package com.mapsocial.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(description = "Request object để đổi mật khẩu")
public class ChangePasswordRequest {

    @NotBlank(message = "Mật khẩu cũ là bắt buộc")
    @Schema(description = "Mật khẩu hiện tại", example = "oldpassword123")
    private String currentPassword;

    @NotBlank(message = "Mật khẩu mới là bắt buộc")
    @Size(min = 6, message = "Mật khẩu mới phải có ít nhất 6 ký tự")
    @Schema(description = "Mật khẩu mới (tối thiểu 6 ký tự)", example = "newpassword123")
    private String newPassword;
}
