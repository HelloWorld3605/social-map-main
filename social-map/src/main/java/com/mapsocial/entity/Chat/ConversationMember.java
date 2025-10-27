package com.mapsocial.entity.Chat;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "conversation_members")
@CompoundIndexes({
    @CompoundIndex(name = "conversation_user", def = "{'conversationId': 1, 'userId': 1}", unique = true),
    @CompoundIndex(name = "user_active", def = "{'userId': 1, 'active': 1}")
})
public class ConversationMember {

    @Id
    private String id;

    private String conversationId;
    private String userId;

    private LocalDateTime lastReadAt;
    private LocalDateTime joinedAt = LocalDateTime.now();

    // New fields
    private LocalDateTime lastActiveAt;
    private boolean active = true;
    private String role; // "ADMIN", "MEMBER"

    // Typing indicator
    private boolean typing = false;
    private LocalDateTime typingStartedAt;

    // Soft delete
    private boolean deleted = false;
    private LocalDateTime deletedAt;
}
