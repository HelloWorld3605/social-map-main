package com.mapsocial.dto.response;

import com.mapsocial.dto.response.user.UserResponse;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Schema(description = "Response object chứa JWT token và thông tin người dùng khi đăng nhập")
public class LoginResponse {

    @Schema(description = "JWT access token", example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
    private String accessToken;

    @Builder.Default
    @Schema(description = "Loại token", example = "Bearer")
    private String tokenType = "Bearer";

    @Schema(description = "Thời gian hết hạn token (milliseconds)", example = "86400000")
    private Long expiresIn;

    @Schema(description = "Thông tin người dùng")
    private UserResponse user;
}
