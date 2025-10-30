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

import java.util.List;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
@Order(Ordered.HIGHEST_PRECEDENCE + 99)
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtUtils jwtUtils;
    private final CustomUserDetailsService customUserDetailsService;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

                if (accessor != null && accessor.getCommand() != null) {
                    if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                        System.out.println("[WebSocket] CONNECT received. Authorization header: " + accessor.getFirstNativeHeader("Authorization"));
                        System.out.println("[WebSocket] All headers: " + accessor.toNativeHeaderMap());
                        handleConnect(accessor);
                    } else if (StompCommand.SEND.equals(accessor.getCommand()) ||
                               StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
                        if (accessor.getUser() == null) {
                            System.out.println("[WebSocket] SEND/SUBSCRIBE received. No user set. Trying to restore from session.");
                        } else {
                            System.out.println("[WebSocket] SEND/SUBSCRIBE received. User already set: " + accessor.getUser());
                        }
                        handleSendOrSubscribe(accessor);
                        if (accessor.getUser() == null) {
                            System.out.println("[WebSocket] SEND/SUBSCRIBE: Authentication still missing after restore!");
                        } else {
                            System.out.println("[WebSocket] SEND/SUBSCRIBE: Authentication restored: " + accessor.getUser());
                        }
                    }
                }

                return message;
            }

            private void handleConnect(StompHeaderAccessor accessor) {
                List<String> authHeaders = accessor.getNativeHeader("Authorization");
                String authToken = (authHeaders != null && !authHeaders.isEmpty()) ? authHeaders.get(0) : null;

                if (authToken != null && authToken.startsWith("Bearer ")) {
                    String token = authToken.substring(7);
                    System.out.println("[WebSocket] handleConnect: Extracted token: " + token);

                    if (jwtUtils.validateToken(token)) {
                        String email = jwtUtils.getEmailFromToken(token);
                        UserDetails userDetails = customUserDetailsService.loadUserByUsername(email);
                        CustomUserDetailsService.UserPrincipal userPrincipal = (CustomUserDetailsService.UserPrincipal) userDetails;

                        UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                userPrincipal,
                                null,
                                userPrincipal.getAuthorities()
                            );

                        // Set only the UserPrincipal as the user for WebSocket session
                        accessor.setUser(userPrincipal);
                        System.out.println("[WebSocket] handleConnect: UserPrincipal set as user: " + userPrincipal.getUsername());
                        if (accessor.getSessionAttributes() != null) {
                            accessor.getSessionAttributes().put("AUTHENTICATED_USER", authentication);
                            System.out.println("[WebSocket] handleConnect: Authentication stored in session attributes.");
                        }
                    } else {
                        System.out.println("[WebSocket] handleConnect: Invalid JWT token!");
                    }
                } else {
                    System.out.println("[WebSocket] handleConnect: No valid Authorization header found.");
                }
            }

            private void handleSendOrSubscribe(StompHeaderAccessor accessor) {
                if (accessor.getUser() == null && accessor.getSessionAttributes() != null) {
                    UsernamePasswordAuthenticationToken authentication =
                            (UsernamePasswordAuthenticationToken) accessor.getSessionAttributes().get("AUTHENTICATED_USER");

                    if (authentication != null) {
                        accessor.setUser((CustomUserDetailsService.UserPrincipal) authentication.getPrincipal());
                        System.out.println("[WebSocket] handleSendOrSubscribe: Authentication restored from session attributes.");
                    } else {
                        System.out.println("[WebSocket] handleSendOrSubscribe: No authentication found in session attributes.");
                    }
                }
            }

        });
    }
}
