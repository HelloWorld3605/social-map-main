package com.mapsocial.service;

import com.mapsocial.dto.UserStatusDTO;
import com.mapsocial.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserStatusService {

    private final StringRedisTemplate redisTemplate;
    private final UserRepository userRepository;
    private static final Duration ONLINE_TTL = Duration.ofSeconds(60);

    @Autowired
    @Lazy
    private SimpMessagingTemplate messagingTemplate;

    public void markUserOnline(String userId) {
        String key = "user:status:" + userId;
        boolean wasOnline = redisTemplate.hasKey(key);

        Map<String, String> data = Map.of(
            "isOnline", "true",
            "lastActiveAt", LocalDateTime.now().toString()
        );
        redisTemplate.opsForHash().putAll(key, data);
        redisTemplate.expire(key, ONLINE_TTL);

        // Broadcast luôn để sync trạng thái cho các client khác
        if (messagingTemplate != null) {
            messagingTemplate.convertAndSend("/topic/status", Map.of(
                "userId", userId,
                "status", "online"
            ));
        }
    }

    public void markUserOffline(String userId) {
        String key = "user:status:" + userId;
        redisTemplate.delete(key);
        userRepository.updateOnlineStatus(UUID.fromString(userId), false, LocalDateTime.now());

        // Broadcast to WebSocket
        if (messagingTemplate != null) {
            messagingTemplate.convertAndSend("/topic/status", Map.of(
                "userId", userId,
                "status", "offline"
            ));
        }
    }

    public Optional<UserStatusDTO> getUserStatus(String userId) {
        String key = "user:status:" + userId;
        Map<Object, Object> map = redisTemplate.opsForHash().entries(key);
        if (!map.isEmpty()) {
            return Optional.of(new UserStatusDTO(
                Boolean.parseBoolean((String) map.get("isOnline")),
                LocalDateTime.parse((String) map.get("lastActiveAt"))
            ));
        }
        // fallback DB
        return userRepository.findStatusById(UUID.fromString(userId));
    }

    public boolean isUserOnline(String userId) {
        String key = "user:status:" + userId;
        return redisTemplate.hasKey(key);
    }

    public String getLastSeen(String userId) {
        Optional<UserStatusDTO> status = getUserStatus(userId);
        if (status.isPresent()) {
            if (status.get().isOnline()) return "online";
            LocalDateTime lastActive = status.get().getLastActiveAt();
            Duration duration = Duration.between(lastActive, LocalDateTime.now());
            if (duration.getSeconds() < 60) return "vừa xong";
            if (duration.toMinutes() < 60) return duration.toMinutes() + " phút trước";
            if (duration.toHours() < 24) return duration.toHours() + " giờ trước";
            if (duration.toDays() < 7) return duration.toDays() + " ngày trước";
            return lastActive.toLocalDate().toString();
        }
        return "unknown";
    }
}
