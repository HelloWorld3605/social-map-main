package com.mapsocial.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
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

    @JsonProperty("messageType")  // ✅ Map from frontend's messageType to backend's type
    private MessageType type = MessageType.TEXT;

    // ✅ Reply feature
    private String replyToMessageId;

    // ✅ Attachments
    private List<String> attachmentUrls;
}

