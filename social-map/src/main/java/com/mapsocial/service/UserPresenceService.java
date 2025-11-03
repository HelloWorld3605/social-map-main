//package com.mapsocial.service;
//
//import lombok.RequiredArgsConstructor;
//import org.springframework.data.redis.core.StringRedisTemplate;
//import org.springframework.data.redis.core.ValueOperations;
//import org.springframework.stereotype.Service;
//
//import java.time.Duration;
//import java.util.Set;
//
//@Service
//@RequiredArgsConstructor
//public class UserPresenceService {
//
//    private final StringRedisTemplate redisTemplate;
//
//    private static final String ONLINE_USERS_KEY = "online_users";
//
//    public void setUserOnline(String userId) {
//        ValueOperations<String, String> ops = redisTemplate.opsForValue();
//        ops.set("user:status:" + userId, "online", Duration.ofHours(6)); // tự hết hạn sau 6h
//        redisTemplate.opsForSet().add(ONLINE_USERS_KEY, userId);
//    }
//
//    public void setUserOffline(String userId) {
//        redisTemplate.delete("user:status:" + userId);
//        redisTemplate.opsForSet().remove(ONLINE_USERS_KEY, userId);
//    }
//
//    public boolean isUserOnline(String userId) {
//        String status = redisTemplate.opsForValue().get("user:status:" + userId);
//        return "online".equals(status);
//    }
//
//    public Set<String> getAllOnlineUsers() {
//        return redisTemplate.opsForSet().members(ONLINE_USERS_KEY);
//    }
//}
