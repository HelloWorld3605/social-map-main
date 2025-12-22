package com.mapsocial.mapper;

import com.mapsocial.dto.request.shop.CreateShopRequest;
import com.mapsocial.dto.response.shop.ShopResponse;
import com.mapsocial.entity.Shop;
import com.mapsocial.entity.Tag;
import com.mapsocial.enums.ShopStatus;

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
                .imageShopUrl(request.getImageShopUrl() != null ? request.getImageShopUrl() : new java.util.ArrayList<>())
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
                .status(shop.getStatus())
                .rating(shop.getRating())
                .reviewCount(shop.getReviewCount())
                .imageShopUrl(shop.getImageShopUrl())
                .tags(shop.getTags() != null
                        ? shop.getTags().stream()
                                .map(Tag::getName)
                                .toList()
                        : new java.util.ArrayList<>())
                .build();
    }

    /**
     * Convert Shop entity to ShopResponse với computed status từ Redis
     * @param shop Shop entity
     * @param computedStatus Trạng thái được tính toán dựa trên giờ mở/đóng cửa
     * @return ShopResponse với trạng thái đã tính toán
     */
    public static ShopResponse toShopResponse(Shop shop, ShopStatus computedStatus) {
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
                .status(computedStatus)
                .rating(shop.getRating())
                .reviewCount(shop.getReviewCount())
                .imageShopUrl(shop.getImageShopUrl())
                .tags(shop.getTags() != null
                        ? shop.getTags().stream()
                                .map(Tag::getName)
                                .toList()
                        : new java.util.ArrayList<>())
                .build();
    }
}
