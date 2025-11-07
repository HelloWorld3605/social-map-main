package com.mapsocial.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserStatusSubscriber implements MessageListener {

    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public void onMessage(org.springframework.data.redis.connection.Message message, byte[] pattern) {
        String payload = new String(message.getBody(), StandardCharsets.UTF_8);

        // Ví dụ payload: "123e4567:online"
        String[] parts = payload.split(":");
        if (parts.length != 2) {
            return; // Invalid payload
        }

        String userId = parts[0];
        String status = parts[1];

        // Gửi tới tất cả client đang subscribe /topic/status
        messagingTemplate.convertAndSend("/topic/status", Map.of(
                "userId", userId,
                "status", status
        ));
    }
}
