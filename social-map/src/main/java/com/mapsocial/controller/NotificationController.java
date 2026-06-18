package com.mapsocial.controller;

import com.mapsocial.dto.response.notification.NotificationResponse;
import com.mapsocial.service.NotificationService;
import com.mapsocial.service.impl.CustomUserDetailsService.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "API quản lý thông báo của người dùng")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @Operation(summary = "Lấy tất cả thông báo của người dùng đăng nhập")
    public ResponseEntity<List<NotificationResponse>> getNotifications(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<NotificationResponse> notifications = notificationService.getNotificationsForUser(userPrincipal.getUser().getId());
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Lấy số lượng thông báo chưa đọc")
    public ResponseEntity<Long> getUnreadCount(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        long count = notificationService.getUnreadCount(userPrincipal.getUser().getId());
        return ResponseEntity.ok(count);
    }

    @PutMapping("/{notificationId}/read")
    @Operation(summary = "Đánh dấu một thông báo là đã đọc")
    public ResponseEntity<Void> markAsRead(
            @PathVariable UUID notificationId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        notificationService.markAsRead(notificationId, userPrincipal.getUser().getId());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/read-all")
    @Operation(summary = "Đánh dấu tất cả thông báo là đã đọc")
    public ResponseEntity<Void> markAllAsRead(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        notificationService.markAllAsRead(userPrincipal.getUser().getId());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{notificationId}")
    @Operation(summary = "Xóa một thông báo")
    public ResponseEntity<Void> deleteNotification(
            @PathVariable UUID notificationId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        notificationService.deleteNotification(notificationId, userPrincipal.getUser().getId());
        return ResponseEntity.ok().build();
    }
}
