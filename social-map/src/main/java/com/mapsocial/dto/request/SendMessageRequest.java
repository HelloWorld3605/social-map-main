package com.mapsocial.dto.request;

import com.mapsocial.enums.MessageType;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SendMessageRequest {
    private String conversationId;
    private String content;
    private MessageType type = MessageType.TEXT;

    // ✅ Reply feature
    private String replyToMessageId;

    // ✅ Attachments
    private List<String> attachmentUrls;
}

