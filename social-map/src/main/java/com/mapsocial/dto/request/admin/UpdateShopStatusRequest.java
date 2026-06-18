package com.mapsocial.dto.request.admin;

import com.mapsocial.enums.ShopStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateShopStatusRequest {

    @NotNull(message = "Trạng thái không được để trống")
    private ShopStatus status;
}
