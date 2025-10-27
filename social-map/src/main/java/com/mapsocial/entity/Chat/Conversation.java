package com.mapsocial.entity.Chat;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "conversations")
public class Conversation {

    @Id
    private String id;

    private boolean isGroup = false;
    private String groupName;
    private String groupAvatar; // Avatar cho group chat
    private String createdBy; // userId

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime lastMessageAt; // Thời gian tin nhắn cuối cùng - dùng để sort conversations
    private LocalDateTime updatedAt; // Thời gian cập nhật conversation
}
