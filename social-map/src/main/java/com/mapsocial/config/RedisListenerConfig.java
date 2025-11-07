package com.mapsocial.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;

import jakarta.annotation.PostConstruct;


@Configuration
@RequiredArgsConstructor
public class RedisListenerConfig {

    private final RedisMessageListenerContainer redisContainer;
    private final com.mapsocial.service.UserStatusSubscriber subscriber;
    private final ChannelTopic topic;

    @PostConstruct
    public void init() {
        redisContainer.addMessageListener(subscriber, topic);
    }
}
