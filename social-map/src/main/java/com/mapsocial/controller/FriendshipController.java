package com.mapsocial.controller;


import com.mapsocial.dto.request.friendship.FriendRequestDTO;
import com.mapsocial.dto.response.friendship.FriendListDTO;
import com.mapsocial.dto.response.friendship.FriendResponseDTO;
import com.mapsocial.service.FriendshipService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.mapsocial.service.impl.CustomUserDetailsService.UserPrincipal;

@RestController
@RequestMapping("/api/friends")
@RequiredArgsConstructor
public class FriendshipController {

    private final FriendshipService friendshipService;

    // Gửi lời mời kết bạn
    @PostMapping("/request")
    public ResponseEntity<FriendResponseDTO> sendRequest(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody FriendRequestDTO request
    ) {
        UUID senderId = userPrincipal.getUser().getId();
        return ResponseEntity.ok(friendshipService.sendRequest(senderId, request.receiverId()));
    }

    // Chấp nhận lời mời
    @PutMapping("/{friendshipId}/accept")
    public ResponseEntity<FriendResponseDTO> acceptRequest(
            @PathVariable Long friendshipId,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UUID authenticatedUserId = userPrincipal.getUser().getId();
        return ResponseEntity.ok(friendshipService.acceptRequest(friendshipId, authenticatedUserId));
    }

    // Hủy/Từ chối lời mời
    @DeleteMapping("/{friendshipId}")
    public ResponseEntity<Void> cancelOrRejectRequest(
            @PathVariable Long friendshipId,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UUID authenticatedUserId = userPrincipal.getUser().getId();
        friendshipService.cancelOrRejectRequest(friendshipId, authenticatedUserId);
        return ResponseEntity.noContent().build();
    }

    // Lấy danh sách bạn bè (của chính mình)
    @GetMapping("/list/me")
    public ResponseEntity<List<FriendListDTO>> getMyFriendList(
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UUID authenticatedUserId = userPrincipal.getUser().getId();
        return ResponseEntity.ok(friendshipService.getFriendList(authenticatedUserId));
    }

    // Lấy danh sách bạn bè của người khác (vẫn giữ API cũ)
    @GetMapping("/list/{userId}")
    public ResponseEntity<List<FriendListDTO>> getFriendList(@PathVariable UUID userId) {
        return ResponseEntity.ok(friendshipService.getFriendList(userId));
    }

    // Lấy danh sách lời mời (của chính mình)
    @GetMapping("/pending/me")
    public ResponseEntity<List<FriendResponseDTO>> getMyPendingRequests(
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UUID authenticatedUserId = userPrincipal.getUser().getId();
        return ResponseEntity.ok(friendshipService.getPendingRequests(authenticatedUserId));
    }

    // Lấy danh sách lời mời kết bạn đã gửi (sent requests)
    @GetMapping("/sent/me")
    public ResponseEntity<List<FriendResponseDTO>> getMySentRequests(
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        UUID authenticatedUserId = userPrincipal.getUser().getId();
        return ResponseEntity.ok(friendshipService.getSentRequests(authenticatedUserId));
    }

    // Kiểm tra trạng thái friendship với user khác
    @GetMapping("/status/{otherUserId}")
    public ResponseEntity<String> getFriendshipStatus(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID otherUserId
    ) {
        UUID userId = userPrincipal.getUser().getId();
        return ResponseEntity.ok(friendshipService.getFriendshipStatus(userId, otherUserId));
    }

    // Hủy kết bạn
    @DeleteMapping("/unfriend/{friendId}")
    public ResponseEntity<Void> unfriend(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID friendId
    ) {
        UUID userId = userPrincipal.getUser().getId();
        friendshipService.unfriend(userId, friendId);
        return ResponseEntity.noContent().build();
    }
}
