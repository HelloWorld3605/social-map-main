package com.mapsocial.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TypingDTO {
    private String conversationId;
    private String userId;
    private String username;

    // Use "typing" as field name to avoid Lombok getter naming issues
    // Support both "typing" and "isTyping" from frontend via @JsonProperty
    @JsonProperty("typing")
    private boolean typing;

    // Also accept "isTyping" from frontend for backward compatibility
    @JsonProperty("isTyping")
    public void setIsTyping(boolean isTyping) {
        this.typing = isTyping;
    }

    // Getter for "isTyping" to maintain backward compatibility
    public boolean isTyping() {
        return typing;
    }
}

