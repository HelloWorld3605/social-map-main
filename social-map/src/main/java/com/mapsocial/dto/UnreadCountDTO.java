package com.mapsocial.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UnreadCountDTO {
    private String conversationId;
    private int unreadCount;
}

