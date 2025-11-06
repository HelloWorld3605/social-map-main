package com.mapsocial.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request object cho bounding box query (lấy shops trong vùng nhìn thấy)")
public class BoundingBoxRequest {

    @NotNull(message = "North là bắt buộc")
    @DecimalMin(value = "-90.0", message = "North phải >= -90")
    @DecimalMax(value = "90.0", message = "North phải <= 90")
    @Schema(description = "Tọa độ vĩ độ phía Bắc", example = "21.0285")
    private Double north;

    @NotNull(message = "South là bắt buộc")
    @DecimalMin(value = "-90.0", message = "South phải >= -90")
    @DecimalMax(value = "90.0", message = "South phải <= 90")
    @Schema(description = "Tọa độ vĩ độ phía Nam", example = "21.0000")
    private Double south;

    @NotNull(message = "East là bắt buộc")
    @DecimalMin(value = "-180.0", message = "East phải >= -180")
    @DecimalMax(value = "180.0", message = "East phải <= 180")
    @Schema(description = "Tọa độ kinh độ phía Đông", example = "105.8542")
    private Double east;

    @NotNull(message = "West là bắt buộc")
    @DecimalMin(value = "-180.0", message = "West phải >= -180")
    @DecimalMax(value = "180.0", message = "West phải <= 180")
    @Schema(description = "Tọa độ kinh độ phía Tây", example = "105.8000")
    private Double west;

    @Schema(description = "Zoom level của bản đồ (1-20)", example = "13")
    private Integer zoom;

    @Schema(description = "Giới hạn số lượng kết quả", example = "500")
    private Integer limit;
}

