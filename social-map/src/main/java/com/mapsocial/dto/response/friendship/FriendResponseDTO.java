package com.mapsocial.dto.response.friendship;

import com.mapsocial.enums.FriendshipStatus;
import java.time.LocalDateTime;
import java.util.UUID;
//Dùng để trả về thông tin mối quan hệ bạn bè (trạng thái, người gửi/nhận, thời gian,...):
public record FriendResponseDTO(
        Long id,
        UUID senderId,
        String senderName,
        String senderAvatar,
        UUID receiverId,
        String receiverName,
        String receiverAvatar,
        FriendshipStatus status,
        LocalDateTime createdAt
) {}
