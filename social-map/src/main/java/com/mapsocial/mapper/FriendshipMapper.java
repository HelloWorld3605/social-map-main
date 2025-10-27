package com.mapsocial.mapper;


import com.mapsocial.dto.response.friendship.FriendListDTO;
import com.mapsocial.dto.response.friendship.FriendResponseDTO;
import com.mapsocial.entity.Friendship;
import com.mapsocial.entity.User;
import org.mapstruct.*;
import java.util.List;

@Mapper(componentModel = "spring")
public interface FriendshipMapper {

    @Mapping(source = "sender.id", target = "senderId")
    @Mapping(source = "sender.displayName", target = "senderName")
    @Mapping(source = "sender.avatarUrl", target = "senderAvatar")
    @Mapping(source = "receiver.id", target = "receiverId")
    @Mapping(source = "receiver.displayName", target = "receiverName")
    @Mapping(source = "receiver.avatarUrl", target = "receiverAvatar")
    FriendResponseDTO toResponseDTO(Friendship friendship);

    List<FriendResponseDTO> toResponseDTOs(List<Friendship> friendships);

    default FriendListDTO toFriendListDTO(User user) {
        return new FriendListDTO(user.getId(), user.getDisplayName(), user.getAvatarUrl());
    }
}
