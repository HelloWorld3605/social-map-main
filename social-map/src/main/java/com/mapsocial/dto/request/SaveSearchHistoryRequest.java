package com.mapsocial.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Schema(description = "Request object để lưu lịch sử tìm kiếm")
public class SaveSearchHistoryRequest {

    @NotBlank(message = "Query là bắt buộc")
    @Schema(description = "Nội dung tìm kiếm", example = "Hanoi")
    private String query;

    @NotBlank(message = "Type là bắt buộc")
    @Schema(description = "Loại tìm kiếm (user, shop, location, query)", example = "location")
    private String type;

    @Schema(description = "Dữ liệu bổ sung (JSON string)", example = "{\"place_name\": \"Hanoi, Vietnam\"}")
    private String data;
}
