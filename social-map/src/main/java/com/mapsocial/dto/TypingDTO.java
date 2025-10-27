package com.mapsocial.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TypingDTO {
    private String conversationId;
    private String userId;
    private String username;
    private boolean isTyping;
}

