package com.mapsocial.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConversationUpdateDTO {
    private String conversationId;
    private String lastMessageContent;
    private String lastMessageSenderId;
    private LocalDateTime lastMessageAt;
    private int unreadCount;
}
