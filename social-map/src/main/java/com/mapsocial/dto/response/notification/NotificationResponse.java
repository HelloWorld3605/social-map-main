package com.mapsocial.dto.response.notification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class NotificationResponse {
    private UUID id;
    private String title;
    private String content;
    private String type;
    private String relatedId;
    private Boolean isRead;
    private LocalDateTime createdAt;
}
