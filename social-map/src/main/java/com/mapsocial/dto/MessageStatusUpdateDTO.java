package com.mapsocial.dto;

import com.mapsocial.enums.MessageStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for real-time message status updates (WebSocket)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageStatusUpdateDTO {
    private String messageId;
    private String conversationId;
    private MessageStatus status;
    private List<MessageSeenByDTO> seenBy;
    private LocalDateTime updatedAt;
}

