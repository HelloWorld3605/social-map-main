package com.mapsocial.dto.request.menu;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class CreateMenuRequest {
    @NotBlank(message = "Tên menu không được để trống")
    private String name;

    @NotNull(message = "Shop ID không được để trống")
    private UUID shopId;

    private List<MenuItemRequest> items; // danh sách món
}
