package com.mapsocial.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Schema(description = "Request object để bắt đầu quá trình đăng ký bằng email")
public class EmailRegistrationRequest {

    @Email(message = "Email không hợp lệ")
    @NotBlank(message = "Email là bắt buộc")
    @Schema(description = "Email để đăng ký", example = "user@example.com")
    private String email;
}
