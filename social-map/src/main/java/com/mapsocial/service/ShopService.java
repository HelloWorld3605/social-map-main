package com.mapsocial.service;

import com.mapsocial.dto.request.shop.CreateShopRequest;
import com.mapsocial.dto.request.shop.UpdateShopRequest;
import com.mapsocial.dto.response.shop.ShopResponse;

import java.util.List;
import java.util.UUID;

public interface ShopService {
    ShopResponse createShop(UUID userId, CreateShopRequest request);
    ShopResponse updateShop(UUID userId, UUID shopId, UpdateShopRequest request);
    void deleteShop(UUID userId, UUID shopId);
    ShopResponse getShopById(UUID shopId);
    List<ShopResponse> getAllShops();
}
