package com.mapsocial.dto.response.friendship;

import java.util.UUID;
//Dùng khi muốn trả danh sách bạn bè cho người dùng:
public record FriendListDTO(
        UUID id,
        String displayName,
        String avatarUrl
) {}
