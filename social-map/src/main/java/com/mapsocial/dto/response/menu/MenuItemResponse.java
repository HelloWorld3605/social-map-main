package com.mapsocial.dto.response.menu;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class MenuItemResponse {
    private UUID id;
    private String name;
    private String description;
    private Double price;
    private String imageUrl;
}
