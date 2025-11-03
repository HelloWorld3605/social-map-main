package com.mapsocial.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class SellerRegistrationRequest {

    // Chỉ yêu cầu CCCD để xác minh danh tính
    @NotBlank(message = "CCCD không được để trống")
    @Pattern(regexp = "^[0-9]{12}$", message = "CCCD phải là 12 chữ số")
    private String citizenId;
}
