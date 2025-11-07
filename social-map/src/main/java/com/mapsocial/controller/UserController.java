package com.mapsocial.controller;

import com.mapsocial.dto.request.user.UpdateProfileRequest;
import com.mapsocial.dto.response.user.UserResponse;
import com.mapsocial.service.UserService;
import com.mapsocial.service.UserStatusService;
import com.mapsocial.service.impl.CustomUserDetailsService.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "User Management", description = "API quản lý thông tin người dùng")
public class UserController {

    private final UserService userService;
    private final UserStatusService userStatusService;

    @GetMapping("/{id}")
    @Operation(summary = "Lấy thông tin profile người dùng")
    public ResponseEntity<UserResponse> getProfile(@PathVariable UUID id) {
        UserResponse user = userService.getProfile(id);
        return ResponseEntity.ok(user);
    }

    @GetMapping("/me")
    @Operation(summary = "Lấy thông tin profile của chính mình")
    public ResponseEntity<UserResponse> getMyProfile(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        UUID userId = userPrincipal.getUser().getId();
        UserResponse user = userService.getProfile(userId);
        return ResponseEntity.ok(user);
    }

    @PutMapping("/me")
    @Operation(summary = "Cập nhật thông tin profile của chính mình")
    public ResponseEntity<UserResponse> updateMyProfile(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody UpdateProfileRequest request) {
        UUID userId = userPrincipal.getUser().getId();
        UserResponse updatedUser = userService.updateProfile(userId, request);
        return ResponseEntity.ok(updatedUser);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật thông tin profile người dùng (deprecated - dùng /me)")
    @Deprecated
    public ResponseEntity<UserResponse> updateProfile(@PathVariable UUID id,
                                                    @Valid @RequestBody UpdateProfileRequest request) {
        UserResponse updatedUser = userService.updateProfile(id, request);
        return ResponseEntity.ok(updatedUser);
    }

    @DeleteMapping("/me")
    @Operation(summary = "Xóa tài khoản của chính mình (soft delete)")
    public ResponseEntity<String> deleteMyAccount(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        UUID userId = userPrincipal.getUser().getId();
        userService.deleteUser(userId);
        return ResponseEntity.ok("Tài khoản đã được xóa thành công");
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa tài khoản người dùng (deprecated - dùng /me)")
    @Deprecated
    public ResponseEntity<String> deleteUser(@PathVariable UUID id) {
        userService.deleteUser(id);
        return ResponseEntity.ok("Tài khoản đã được xóa thành công");
    }

    @GetMapping("/me/mutual-friends/{otherUserId}/count")
    @Operation(summary = "Đếm số bạn chung giữa mình và user khác")
    public ResponseEntity<Long> getMyMutualFriendsCount(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID otherUserId
    ) {
        UUID userId = userPrincipal.getUser().getId();
        return ResponseEntity.ok(userService.getMutualFriendsCount(userId, otherUserId));
    }

    @GetMapping("/{userId}/mutual-friends/{otherUserId}/count")
    @Operation(summary = "Đếm số bạn chung giữa 2 user (deprecated - dùng /me)")
    @Deprecated
    public ResponseEntity<Long> getMutualFriendsCount(
            @PathVariable UUID userId,
            @PathVariable UUID otherUserId
    ) {
        return ResponseEntity.ok(userService.getMutualFriendsCount(userId, otherUserId));
    }

    @GetMapping("/{id}/status")
    @Operation(summary = "Lấy trạng thái hoạt động của người dùng")
    public ResponseEntity<?> getUserStatus(@PathVariable String id) {
        boolean isOnline = userStatusService.isUserOnline(id);
        String lastSeen = userStatusService.getLastSeen(id);
        return ResponseEntity.ok(Map.of(
                "isOnline", isOnline,
                "lastSeen", lastSeen
        ));
    }
}
