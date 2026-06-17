package com.mapsocial.dto.request.note;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateNoteRequest {

    @NotBlank(message = "Tiêu đề không được để trống")
    @Size(max = 255, message = "Tiêu đề không được vượt quá 255 ký tự")
    private String title;

    /**
     * JSON string của mảng tabs (toàn bộ state hiện tại của note).
     * Cấu trúc: [{ id, title, blocks: [{ id, type, content?, marker? }] }]
     */
    @NotBlank(message = "Nội dung tabs không được để trống")
    private String tabs;

    private String activeTabId;
}
