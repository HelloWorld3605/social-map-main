package com.mapsocial.dto.request.menu;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateMenuRequest {
    @NotBlank(message = "Tên menu không được để trống")
    private String name;
}
