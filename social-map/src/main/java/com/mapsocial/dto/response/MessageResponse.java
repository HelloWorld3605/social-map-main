package com.mapsocial.dto.response;

import com.mapsocial.enums.MessageType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageResponse {
    private String id;
    private String conversationId;
    private String senderId;
    private String senderName;
    private String content;
    private MessageType type;
    private LocalDateTime createdAt;
    private boolean isRead;
}

