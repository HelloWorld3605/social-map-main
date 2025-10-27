package com.mapsocial.dto.request.user;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(description = "Request object để cập nhật thông tin người dùng")
public class UpdateProfileRequest {

    @Size(max = 20, message = "Tên hiển thị không được vượt quá 20 ký tự")
    @Schema(description = "Tên hiển thị (tối đa 20 ký tự)", example = "John Updated")
    private String displayName;

    @Schema(description = "URL ảnh đại diện", example = "https://example.com/new-avatar.jpg")
    private String avatarUrl;

    @Schema(description = "URL ảnh nêền", example = "https://example.com/new-avatar.jpg")
    private String coverPhoto;
}
