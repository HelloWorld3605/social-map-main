package com.mapsocial.mapper;

import com.mapsocial.dto.request.shop.CreateShopRequest;
import com.mapsocial.dto.response.shop.ShopResponse;
import com.mapsocial.entity.Shop;
import com.mapsocial.entity.Tag;

public class ShopMapper {

    private ShopMapper() {
        throw new UnsupportedOperationException("Utility class");
    }

    public static Shop toShop(CreateShopRequest request) {
        Shop shop = Shop.builder()
                .name(request.getName())
                .address(request.getAddress())
                .description(request.getDescription())
                .phoneNumber(request.getPhoneNumber())
                .openingTime(request.getOpeningTime())
                .closingTime(request.getClosingTime())
                .build();

        // Set coordinates từ lớp cha Marker bằng MarkerMapper
        MarkerMapper.setCoordinates(shop, request.getLatitude(), request.getLongitude());

        return shop;
    }

    public static ShopResponse toShopResponse(Shop shop) {
        return ShopResponse.builder()
                .id(shop.getId())
                .name(shop.getName())
                .address(shop.getAddress())
                .latitude(shop.getLatitude())
                .longitude(shop.getLongitude())
                .description(shop.getDescription())
                .phoneNumber(shop.getPhoneNumber())
                .openingTime(shop.getOpeningTime())
                .closingTime(shop.getClosingTime())
                .rating(shop.getRating())
                .reviewCount(shop.getReviewCount())
                .tags(shop.getTags()
                        .stream()
                        .map(Tag::getName)
                        .toList())
                .build();
    }
}
