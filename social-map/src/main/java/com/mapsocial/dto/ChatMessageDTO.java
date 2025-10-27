package com.mapsocial.dto;

import com.mapsocial.enums.MessageType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageDTO {

    private String conversationId; // Có thể null khi chat lần đầu

    @NotBlank(message = "Sender ID is required")
    private String senderId;

    private String recipientId; // ID người nhận (dùng khi tạo conversation mới)

    @NotBlank(message = "Content cannot be empty")
    @Size(max = 5000, message = "Message too long (max 5000 characters)")
    private String content;

    private MessageType messageType = MessageType.TEXT;
}
