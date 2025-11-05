package com.mapsocial.dto.response.shop;

import com.mapsocial.enums.ShopStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class ShopResponse {
    private UUID id;
    private String name;
    private String address;
    private Double latitude;
    private Double longitude;
    private String description;
    private String phoneNumber;
    private LocalTime openingTime;
    private LocalTime closingTime;
    private ShopStatus status; // trạng thái shop
    private Double rating;
    private Integer reviewCount;
    private List<String> imageShopUrl; // danh sách URL ảnh của shop
    private List<String> tags; // tên tag
}
