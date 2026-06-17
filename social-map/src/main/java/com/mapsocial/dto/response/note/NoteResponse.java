package com.mapsocial.dto.response.note;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
public class NoteResponse {

    private UUID id;
    private String title;

    /**
     * JSON string của mảng tabs — trả thẳng về FE để parse.
     */
    private String tabs;

    private String activeTabId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
