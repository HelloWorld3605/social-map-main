package com.mapsocial.service;

import com.mapsocial.dto.response.notification.NotificationResponse;
import com.mapsocial.entity.User;

import java.util.List;
import java.util.UUID;

public interface NotificationService {
    NotificationResponse createNotification(User user, String title, String content, String type, String relatedId);
    List<NotificationResponse> getNotificationsForUser(UUID userId);
    long getUnreadCount(UUID userId);
    void markAsRead(UUID notificationId, UUID userId);
    void markAllAsRead(UUID userId);
    void deleteNotification(UUID notificationId, UUID userId);
}
