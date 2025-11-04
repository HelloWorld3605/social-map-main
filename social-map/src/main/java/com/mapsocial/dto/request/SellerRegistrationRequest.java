package com.mapsocial.dto.request;

import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class SellerRegistrationRequest {

    // CCCD - Optional, chỉ yêu cầu nếu user chưa có
    @Pattern(regexp = "^[0-9]{12}$", message = "CCCD phải là 12 chữ số")
    private String citizenId;
}
