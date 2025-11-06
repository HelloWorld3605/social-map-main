package com.mapsocial.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Response cho shop cluster hoặc individual shop")
public class ShopClusterResponse {

    @Schema(description = "Loại: 'cluster' hoặc 'shop'")
    private String type; // "cluster" or "shop"

    @Schema(description = "ID của shop (nếu type = shop)")
    private String id;

    @Schema(description = "Tên shop (nếu type = shop)")
    private String name;

    @Schema(description = "Vĩ độ")
    private Double latitude;

    @Schema(description = "Kinh độ")
    private Double longitude;

    @Schema(description = "Số lượng shops trong cluster (nếu type = cluster)")
    private Integer count;

    @Schema(description = "Danh sách shop IDs trong cluster (nếu type = cluster)")
    private List<String> shopIds;

    // Shop details (when type = shop)
    @Schema(description = "Địa chỉ (nếu type = shop)")
    private String address;

    @Schema(description = "URL ảnh (nếu type = shop)")
    private String imageUrl;

    @Schema(description = "Rating (nếu type = shop)")
    private Double rating;

    @Schema(description = "Trạng thái (nếu type = shop)")
    private String status;
}

