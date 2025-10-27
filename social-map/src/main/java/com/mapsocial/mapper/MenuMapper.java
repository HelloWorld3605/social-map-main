package com.mapsocial.mapper;

import com.mapsocial.dto.request.menu.CreateMenuRequest;
import com.mapsocial.dto.request.menu.MenuItemRequest;
import com.mapsocial.dto.response.menu.MenuItemResponse;
import com.mapsocial.dto.response.menu.MenuResponse;
import com.mapsocial.entity.Menu;
import com.mapsocial.entity.MenuItem;
import com.mapsocial.entity.Shop;

import java.util.List;
import java.util.stream.Collectors;

public class MenuMapper {

    public static Menu toEntity(CreateMenuRequest request, Shop shop) {
        Menu menu = new Menu();
        menu.setName(request.getName());
        menu.setShop(shop);

        if (request.getItems() != null) {
            List<MenuItem> items = request.getItems().stream()
                    .map(i -> toMenuItemEntity(i, menu))
                    .collect(Collectors.toList());
            menu.setItems(items);
        }
        return menu;
    }

    public static MenuItem toMenuItemEntity(MenuItemRequest request, Menu menu) {
        MenuItem item = new MenuItem();
        item.setName(request.getName());
        item.setDescription(request.getDescription());
        item.setPrice(request.getPrice());
        item.setImageUrl(request.getImageUrl());
        item.setMenu(menu);
        return item;
    }

    public static MenuResponse toResponse(Menu menu) {
        return MenuResponse.builder()
                .id(menu.getId())
                .name(menu.getName())
                .shopId(menu.getShop().getId())
                .items(menu.getItems().stream()
                        .map(MenuMapper::toMenuItemResponse)
                        .collect(Collectors.toList()))
                .build();
    }

    public static MenuItemResponse toMenuItemResponse(MenuItem item) {
        return MenuItemResponse.builder()
                .id(item.getId())
                .name(item.getName())
                .description(item.getDescription())
                .price(item.getPrice())
                .imageUrl(item.getImageUrl())
                .build();
    }
}
