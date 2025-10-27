package com.mapsocial.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConversationResponse {
    private String id;
    private boolean isGroup;
    private String groupName;
    private String createdBy;
    private LocalDateTime createdAt;
    private List<String> memberIds;
    private MessageResponse lastMessage;
    private int unreadCount;
}

