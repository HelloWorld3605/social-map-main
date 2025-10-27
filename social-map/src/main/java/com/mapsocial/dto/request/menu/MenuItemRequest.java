package com.mapsocial.dto.request.menu;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MenuItemRequest {
    @NotBlank(message = "Tên món không được để trống")
    private String name;

    private String description;

    @NotNull(message = "Giá món không được để trống")
    private Double price;

    private String imageUrl;
}
