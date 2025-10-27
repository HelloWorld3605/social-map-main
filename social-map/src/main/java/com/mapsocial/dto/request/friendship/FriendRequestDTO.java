package com.mapsocial.dto.request.friendship;

import java.util.UUID;
//Dùng khi người dùng gửi lời mời kết bạn:
public record FriendRequestDTO(UUID receiverId) {

}
