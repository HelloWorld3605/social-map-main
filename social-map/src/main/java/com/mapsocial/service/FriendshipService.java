package com.mapsocial.service;

import com.mapsocial.dto.response.friendship.FriendListDTO;
import com.mapsocial.dto.response.friendship.FriendResponseDTO;

import java.util.List;
import java.util.UUID;

public interface FriendshipService {

    FriendResponseDTO sendRequest(UUID senderId, UUID receiverId);

    FriendResponseDTO acceptRequest(Long friendshipId, UUID userId);

    void cancelOrRejectRequest(Long friendshipId, UUID userId);

    List<FriendListDTO> getFriendList(UUID userId);

    List<FriendResponseDTO> getPendingRequests(UUID userId);

    List<FriendResponseDTO> getSentRequests(UUID userId);

    FriendResponseDTO blockUser(UUID blockerId, UUID blockedId);

    String getFriendshipStatus(UUID userId, UUID otherUserId);

    void unfriend(UUID userId, UUID friendId);
}
