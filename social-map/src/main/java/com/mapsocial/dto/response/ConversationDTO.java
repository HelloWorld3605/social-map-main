package com.mapsocial.dto.response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConversationDTO {
    private String id;
    private boolean isGroup;
    private String groupName;
    private String groupAvatar;

    // Summary info thay vì trả về toàn bộ messages
    private String lastMessageContent;
    private String lastMessageSenderId;
    private LocalDateTime lastMessageAt;

    // Unread count (calculated)
    private int unreadCount;

    // Members info
    private List<ConversationMemberDTO> members;

    // Typing status
    private List<String> typingUserIds;

    private LocalDateTime createdAt;
}

