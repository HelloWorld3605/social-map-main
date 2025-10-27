package com.mapsocial.service;

import com.mapsocial.dto.request.menu.CreateMenuRequest;
import com.mapsocial.dto.response.menu.MenuResponse;
import com.mapsocial.dto.request.menu.UpdateMenuRequest;

import java.util.UUID;

public interface MenuService {
    MenuResponse createMenu(CreateMenuRequest request, UUID sellerId);
    MenuResponse updateMenu(UUID menuId, UpdateMenuRequest request, UUID sellerId);
    void deleteMenu(UUID menuId, UUID sellerId);
    MenuResponse getMenuById(UUID menuId);
}
