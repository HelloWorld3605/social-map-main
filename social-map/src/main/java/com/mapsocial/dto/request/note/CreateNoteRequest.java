package com.mapsocial.dto.request.note;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateNoteRequest {

    @NotBlank(message = "Tiêu đề không được để trống")
    @Size(max = 255, message = "Tiêu đề không được vượt quá 255 ký tự")
    private String title;

    /**
     * JSON string của mảng tabs.
     * Cấu trúc: [{ id, title, blocks: [{ id, type, content?, marker? }] }]
     * Nếu không truyền, backend tự tạo tab mặc định.
     */
    private String tabs;

    private String activeTabId;
}
