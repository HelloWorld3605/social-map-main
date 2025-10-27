package com.mapsocial.dto.request;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateConversationRequest {
    private List<String> memberIds; // Danh sách user IDs
    private boolean isGroup;
    private String groupName;
    private String groupAvatar;
}

