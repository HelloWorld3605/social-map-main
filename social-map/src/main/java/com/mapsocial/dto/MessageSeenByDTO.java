package com.mapsocial.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for tracking who has seen a message and when
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageSeenByDTO {
    private String userId;
    private String userName;
    private String userAvatar;
    private LocalDateTime seenAt;
}

