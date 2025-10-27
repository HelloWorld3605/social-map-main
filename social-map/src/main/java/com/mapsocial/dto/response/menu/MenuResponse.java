package com.mapsocial.dto.response.menu;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@Builder
public class MenuResponse {
    private UUID id;
    private String name;
    private UUID shopId;
    private List<MenuItemResponse> items;
}
