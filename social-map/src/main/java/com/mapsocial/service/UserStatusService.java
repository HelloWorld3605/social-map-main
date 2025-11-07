package com.mapsocial.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;

@Service
@RequiredArgsConstructor
public class UserStatusService {

    private final RedisTemplate<String, Object> redisTemplate;

    private static final Duration ONLINE_TIMEOUT = Duration.ofMinutes(2); // sau 2 phút không hoạt động => offline

    // Đánh dấu user đang online
    public void markUserOnline(String userId) {
        redisTemplate.opsForValue().set("user:status:" + userId, "online", ONLINE_TIMEOUT);
        redisTemplate.opsForValue().set("user:lastSeen:" + userId, Instant.now().toString());
    }

    // Đánh dấu user offline
    public void markUserOffline(String userId) {
        redisTemplate.opsForValue().set("user:status:" + userId, "offline", Duration.ofHours(1));
        redisTemplate.opsForValue().set("user:lastSeen:" + userId, Instant.now().toString());
    }

    // Kiểm tra user có đang online không
    public boolean isUserOnline(String userId) {
        Object status = redisTemplate.opsForValue().get("user:status:" + userId);
        return status != null && "online".equals(status.toString());
    }

    // Lấy thời gian hoạt động gần nhất
    public String getLastSeen(String userId) {
        Object time = redisTemplate.opsForValue().get("user:lastSeen:" + userId);
        if (time == null) return "unknown";

        try {
            Instant lastSeen = Instant.parse(time.toString());
            Duration duration = Duration.between(lastSeen, Instant.now());

            if (duration.toMinutes() < 1) {
                return "vừa xong";
            } else if (duration.toHours() < 1) {
                long minutes = duration.toMinutes();
                return minutes + " phút trước";
            } else if (duration.toDays() < 1) {
                long hours = duration.toHours();
                return hours + " giờ trước";
            } else {
                long days = duration.toDays();
                return days + " ngày trước";
            }
        } catch (Exception e) {
            return "unknown";
        }
    }
}
