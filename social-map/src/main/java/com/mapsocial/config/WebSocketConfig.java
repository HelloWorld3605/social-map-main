package com.mapsocial.config;

import com.mapsocial.service.impl.CustomUserDetailsService;
import com.mapsocial.util.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
@Order(Ordered.HIGHEST_PRECEDENCE + 99)
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtUtils jwtUtils;
    private final CustomUserDetailsService customUserDetailsService;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Kênh client có thể subscribe để nhận tin nhắn
        config.enableSimpleBroker("/topic", "/queue");
        // Prefix cho endpoint gửi tin nhắn từ client
        config.setApplicationDestinationPrefixes("/app");
        // User destination prefix
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Endpoint cho client kết nối WebSocket
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*") // Cho phép mọi domain
                .withSockJS(); // Dùng SockJS fallback cho browser cũ
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    // Lấy JWT token từ header
                    String authToken = accessor.getFirstNativeHeader("Authorization");

                    if (authToken != null && authToken.startsWith("Bearer ")) {
                        String token = authToken.substring(7);

                        if (jwtUtils.validateToken(token)) {
                            String email = jwtUtils.getEmailFromToken(token);
                            UserDetails userDetails = customUserDetailsService.loadUserByUsername(email);

                            UsernamePasswordAuthenticationToken authentication =
                                new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,
                                    userDetails.getAuthorities()
                                );

                            accessor.setUser(authentication);
                        }
                    }
                }

                return message;
            }
        });
    }
}
