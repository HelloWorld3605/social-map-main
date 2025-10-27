package com.mapsocial.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConversationMemberDTO {
    private String userId;
    private String username;
    private String fullName;
    private String avatar;

    private String role; // "ADMIN", "MEMBER"
    private LocalDateTime lastReadAt;
    private LocalDateTime joinedAt;
    private boolean isActive;
    private boolean isTyping;
}

