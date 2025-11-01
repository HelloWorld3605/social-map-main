package com.mapsocial.dto.response;

import com.mapsocial.enums.MessageType;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageDTO {
    private String id;
    private String conversationId;

    // Sender info
    private String senderId;
    private String senderName;
    private String senderAvatar;

    private String content;
    private MessageType type;

    // Reply feature
    private String replyToMessageId;
    private MessageDTO replyToMessage; // Nested message info

    // Attachments
    private List<String> attachmentUrls;

    // Edit status
    private boolean isEdited;
    private LocalDateTime updatedAt;

    private LocalDateTime createdAt;
}

