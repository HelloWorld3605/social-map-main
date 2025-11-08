package com.mapsocial.config;

import com.mapsocial.service.UserStatusService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;

import jakarta.annotation.PostConstruct;
import java.util.UUID;

@Configuration
@RequiredArgsConstructor
public class RedisKeyspaceConfig {

    private final RedisMessageListenerContainer redisContainer;
    private final UserStatusService userStatusService;

    @PostConstruct
    public void init() {
        // Listen for expired keys on user:status:* pattern
        redisContainer.addMessageListener(new MessageListener() {
            @Override
            public void onMessage(Message message, byte[] pattern) {
                String key = new String(message.getBody());
                if (key.startsWith("user:status:")) {
                    String userId = key.replace("user:status:", "");
                    userStatusService.markUserOffline(userId);
                }
            }
        }, new ChannelTopic("__keyevent@*__:expired"));
    }
}
