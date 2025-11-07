package com.mapsocial.entity.Chat;

import lombok.*;

import java.time.LocalDateTime;

/**
 * Embedded document to track who has seen a message
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageSeenBy {
    private String userId;
    private LocalDateTime seenAt;
}

