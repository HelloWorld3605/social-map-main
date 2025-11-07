package com.mapsocial.entity.Chat;

import com.mapsocial.enums.MessageStatus;
import com.mapsocial.enums.MessageType;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "messages")
@CompoundIndexes({
    @CompoundIndex(name = "conversation_created", def = "{'conversationId': 1, 'createdAt': -1}"),
    @CompoundIndex(name = "conversation_sender", def = "{'conversationId': 1, 'senderId': 1}")
})
public class Message {

    @Id
    private String id; // MongoDB ID là String

    private String conversationId; // tham chiếu tới Conversation
    private String senderId;       // tham chiếu tới User (chỉ lưu ID)
    private String content;
    private MessageType type = MessageType.TEXT;
    private LocalDateTime createdAt = LocalDateTime.now();

    // New fields for features
    private String replyToMessageId;
    private List<String> attachmentUrls;
    private boolean deleted = false;
    private LocalDateTime updatedAt;
    private boolean edited = false;

    // Message status tracking (Facebook-style)
    @Builder.Default
    private MessageStatus status = MessageStatus.SENT;

    // List of users who have seen this message
    @Builder.Default
    private List<MessageSeenBy> seenBy = new ArrayList<>();
}
