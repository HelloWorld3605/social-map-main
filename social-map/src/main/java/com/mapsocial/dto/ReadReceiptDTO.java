package com.mapsocial.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReadReceiptDTO {
    private String conversationId;
    private String lastMessageId;
    private String readByUserId;
    private String readByUserName;
    private String readByUserAvatar;
    private LocalDateTime readAt;
}

