package com.mapsocial.service;

import com.mapsocial.entity.Chat.Message;
import com.mapsocial.entity.Chat.MessageSeenBy;
import com.mapsocial.enums.MessageStatus;
import com.mapsocial.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class MessageStatusSyncService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final MessageRepository messageRepository;

    @Scheduled(fixedDelay = 10000) // Sync every 10 seconds (between 5-30 as requested)
    @Transactional
    public void syncMessageStatusesToDB() {
        if (redisTemplate == null) {
            return; // Redis not available
        }
        // Get all message status keys
        Set<String> statusKeys = redisTemplate.keys("message:status:*");
        if (statusKeys != null) {
            for (String key : statusKeys) {
                String messageId = key.replace("message:status:", "");
                String statusStr = (String) redisTemplate.opsForValue().get(key);
                if (statusStr != null) {
                    try {
                        MessageStatus status = MessageStatus.valueOf(statusStr);
                        Message message = messageRepository.findById(messageId).orElse(null);
                        if (message != null && !message.getStatus().equals(status)) {
                            message.setStatus(status);
                            message.setUpdatedAt(LocalDateTime.now());
                            messageRepository.save(message);
                            // Optionally delete from Redis after sync
                            // redisTemplate.delete(key);
                        }
                    } catch (Exception e) {
                        // Invalid status, skip
                    }
                }
            }
        }

        // Sync seenBy
        Set<String> seenByKeys = redisTemplate.keys("message:seenBy:*");
        if (seenByKeys != null) {
            for (String key : seenByKeys) {
                String messageId = key.replace("message:seenBy:", "");
                Map<Object, Object> seenByMap = redisTemplate.opsForHash().entries(key);
                Message message = messageRepository.findById(messageId).orElse(null);
                if (message != null) {
                    // Clear existing seenBy and add from Redis
                    message.getSeenBy().clear();
                    for (Map.Entry<Object, Object> entry : seenByMap.entrySet()) {
                        String userId = (String) entry.getKey();
                        LocalDateTime seenAt = LocalDateTime.parse((String) entry.getValue());
                        MessageSeenBy seenBy = MessageSeenBy.builder()
                                .userId(userId)
                                .seenAt(seenAt)
                                .build();
                        message.getSeenBy().add(seenBy);
                    }
                    message.setUpdatedAt(LocalDateTime.now());
                    messageRepository.save(message);
                }
            }
        }
    }
}
