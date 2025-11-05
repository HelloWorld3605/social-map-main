package com.mapsocial.dto.request.shop;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Data
public class UpdateShopRequest {

    @NotBlank(message = "Tên cửa hàng không được để trống")
    @Size(max = 100, message = "Tên cửa hàng tối đa 100 ký tự")
    private String name;

    @NotBlank(message = "Địa chỉ không được để trống")
    @Size(max = 255, message = "Địa chỉ tối đa 255 ký tự")
    private String address;

    @DecimalMin(value = "-90.0", message = "Vĩ độ phải >= -90")
    @DecimalMax(value = "90.0", message = "Vĩ độ phải <= 90")
    private Double latitude;

    @DecimalMin(value = "-180.0", message = "Kinh độ phải >= -180")
    @DecimalMax(value = "180.0", message = "Kinh độ phải <= 180")
    private Double longitude;

    @Size(max = 500, message = "Mô tả tối đa 500 ký tự")
    private String description;

    @Pattern(regexp = "^(0|\\+84)(\\d{9})$",
            message = "Số điện thoại không hợp lệ (VD: 090xxxxxxx hoặc +8490xxxxxxx)")
    private String phoneNumber;

    private LocalTime openingTime;
    private LocalTime closingTime;

    @Size(max = 10, message = "Tối đa 10 ảnh cho shop")
    private List<String> imageShopUrl; // danh sách URL ảnh của shop

    private List<UUID> tagIds;
}
