package com.mapsocial.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Schema(description = "Request object để xác thực email")
public class EmailVerificationRequest {

    @NotBlank(message = "Token xác thực là bắt buộc")
    @Schema(description = "Token xác thực email", example = "eyJhbGciOiJIUzI1NiJ9...")
    private String token;
}

