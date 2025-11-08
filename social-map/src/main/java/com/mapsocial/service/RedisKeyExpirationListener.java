package com.mapsocial.service;

import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.listener.KeyExpirationEventMessageListener;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.stereotype.Component;

@Component
public class RedisKeyExpirationListener extends KeyExpirationEventMessageListener {

    private final UserStatusService userStatusService;

    public RedisKeyExpirationListener(RedisMessageListenerContainer listenerContainer, UserStatusService userStatusService) {
        super(listenerContainer);
        this.userStatusService = userStatusService;
    }

    @Override
    public void onMessage(Message message, byte[] pattern) {
        String expiredKey = new String(message.getBody());
        if (expiredKey.startsWith("user:status:")) {
            String userId = expiredKey.replace("user:status:", "");
            userStatusService.markUserOffline(userId);
        }
    }
}
