package com.mapsocial.controller;


import com.mapsocial.dto.ChatMessageDTO;
import com.mapsocial.dto.ConversationUpdateDTO;
import com.mapsocial.dto.TypingDTO;
import com.mapsocial.dto.UnreadCountDTO;
import com.mapsocial.dto.request.CreateConversationRequest;
import com.mapsocial.dto.request.MarkAsReadRequest;
import com.mapsocial.dto.request.SendMessageRequest;
import com.mapsocial.dto.response.ConversationDTO;
import com.mapsocial.dto.response.MessageDTO;
import com.mapsocial.dto.response.UserSearchDTO;
import com.mapsocial.entity.User;
import com.mapsocial.exception.ChatException;
import com.mapsocial.repository.UserRepository;
import com.mapsocial.service.UserStatusService;
import com.mapsocial.service.chat.ChatService;
import com.mapsocial.service.impl.CustomUserDetailsService.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@Controller
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;
    private final UserStatusService userStatusService;

    // ========== WEBSOCKET ENDPOINTS ==========

    /**
     * WebSocket endpoint - Gửi tin nhắn realtime
     */
    @MessageMapping("/sendMessage")
    public void sendMessage(@Payload ChatMessageDTO chatMessage,
                            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            if (userPrincipal == null || userPrincipal.getUser() == null) {
                throw new ChatException("Authentication required. Please reconnect with valid token.");
            }

            String senderId = userPrincipal.getUser().getId().toString();
            String conversationId = chatMessage.getConversationId();

            if (conversationId == null || conversationId.isEmpty()) {
                if (chatMessage.getRecipientId() == null || chatMessage.getRecipientId().isEmpty()) {
                    throw new ChatException("RecipientId là bắt buộc để tạo cuộc trò chuyện mới");
                }

                ConversationDTO conversation = chatService.getOrCreatePrivateConversation(
                        senderId,
                        chatMessage.getRecipientId()
                );
                conversationId = conversation.getId();
                chatMessage.setConversationId(conversationId);
            }

            // Gửi message
            SendMessageRequest request = SendMessageRequest.builder()
                    .conversationId(conversationId)
                    .content(chatMessage.getContent())
                    .type(chatMessage.getMessageType())
                    .build();

            MessageDTO savedMessage = chatService.sendMessage(senderId, request);

            // Broadcast message tới topic conversation
            messagingTemplate.convertAndSend(
                    "/topic/conversation/" + conversationId,
                    savedMessage
            );

            // Gửi cập nhật unread count cho các thành viên
            final String finalSenderId = senderId;
            final String finalConversationId = conversationId; // <--- thêm dòng này

            ConversationDTO conv = chatService.getConversationById(conversationId, finalSenderId);

            conv.getMembers().forEach(member -> {
                if (!member.getUserId().equals(finalSenderId)) {
                    int unreadCount = chatService.getUnreadCount(finalConversationId, member.getUserId());

                    // Tạo DTO cập nhật
                    UnreadCountDTO unreadDTO = new UnreadCountDTO(finalConversationId, unreadCount);
                    ConversationUpdateDTO updateDTO = new ConversationUpdateDTO(
                            finalConversationId,
                            conv.getLastMessageContent(),
                            conv.getLastMessageSenderId(),
                            conv.getLastMessageAt(),
                            unreadCount
                    );

                    // Gửi tới từng user qua hàng đợi riêng
                    messagingTemplate.convertAndSendToUser(member.getUserId(), "/queue/unread", unreadDTO);
                    messagingTemplate.convertAndSendToUser(member.getUserId(), "/queue/conversation-update", updateDTO);
                }
            });


        } catch (Exception e) {
            if (userPrincipal != null && userPrincipal.getUser() != null) {
                String userId = userPrincipal.getUser().getId().toString();
                messagingTemplate.convertAndSendToUser(
                        userId,
                        "/queue/errors",
                        "Error: " + e.getMessage()
                );
            }
            System.err.println("Error in sendMessage: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * WebSocket endpoint - Mark messages as read
     */
    @MessageMapping("/markAsRead")
    public void handleMarkAsRead(@Payload MarkAsReadRequest request,
                                 @AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            if (userPrincipal == null || userPrincipal.getUser() == null) {
                System.err.println("No authenticated user in markAsRead");
                return;
            }

            String userId = userPrincipal.getUser().getId().toString();
            System.out.println("📖 Mark as read: conversationId=" + request.getConversationId() + " userId=" + userId);

            chatService.markMessagesAsRead(request.getConversationId(), userId);

        } catch (Exception e) {
            System.err.println("Error in markAsRead: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * WebSocket endpoint - Typing indicator
     */
    @MessageMapping("/typing")
    public void handleTyping(@Payload TypingDTO typingDTO,
                             @AuthenticationPrincipal UserPrincipal userPrincipal) {
        System.out.println("handleTyping called with typingDTO: " + typingDTO + " userPrincipal: " + userPrincipal);
        try {
            if (userPrincipal == null || userPrincipal.getUser() == null) return;

            String userId = userPrincipal.getUser().getId().toString();
            String username = userPrincipal.getUser().getDisplayName();

            chatService.setTypingStatus(
                    typingDTO.getConversationId(),
                    userId,
                    typingDTO.isTyping()
            );

            TypingDTO authenticatedTypingDTO = new TypingDTO(
                    typingDTO.getConversationId(),
                    userId,
                    username,
                    typingDTO.isTyping()
            );

            System.out.println("Backend sending typing: " + authenticatedTypingDTO);
            messagingTemplate.convertAndSend(
                    "/topic/conversation/" + typingDTO.getConversationId() + "/typing",
                    authenticatedTypingDTO
            );
        } catch (Exception ignored) {}
    }

    /**
     * WebSocket endpoint - User heartbeat for online status
     */
    @MessageMapping("/user/heartbeat")
    public void handleHeartbeat(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            if (userPrincipal == null || userPrincipal.getUser() == null) return;

            String userId = userPrincipal.getUser().getId().toString();
            userStatusService.markUserOnline(userId);
        } catch (Exception e) {
            System.err.println("Error in handleHeartbeat: " + e.getMessage());
        }
    }

    // ========== REST API ENDPOINTS ==========

    @GetMapping("/api/conversations")
    public ResponseEntity<List<ConversationDTO>> getUserConversations(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        String userId = userPrincipal.getUser().getId().toString();
        List<ConversationDTO> conversations = chatService.getUserConversations(userId);
        return ResponseEntity.ok(conversations);
    }

    @GetMapping("/api/conversations/{conversationId}")
    public ResponseEntity<ConversationDTO> getConversation(
            @PathVariable String conversationId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        String userId = userPrincipal.getUser().getId().toString();
        ConversationDTO conversation = chatService.getConversationById(conversationId, userId);
        return ResponseEntity.ok(conversation);
    }

    @GetMapping("/api/conversations/private/{otherUserId}")
    public ResponseEntity<ConversationDTO> getOrCreatePrivateConversation(
            @PathVariable String otherUserId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        String userId = userPrincipal.getUser().getId().toString();
        ConversationDTO conversation = chatService.getOrCreatePrivateConversation(userId, otherUserId);
        return ResponseEntity.ok(conversation);
    }

    @PostMapping("/api/conversations")
    public ResponseEntity<ConversationDTO> createConversation(
            @Valid @RequestBody CreateConversationRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        String userId = userPrincipal.getUser().getId().toString();
        ConversationDTO conversation = chatService.createConversation(request, userId);
        return ResponseEntity.ok(conversation);
    }

    @PutMapping("/api/conversations/{conversationId}/group-info")
    public ResponseEntity<ConversationDTO> updateGroupInfo(
            @PathVariable String conversationId,
            @RequestParam(required = false) String groupName,
            @RequestParam(required = false) String groupAvatar,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        String userId = userPrincipal.getUser().getId().toString();
        ConversationDTO conversation = chatService.updateGroupInfo(conversationId, userId, groupName, groupAvatar);
        return ResponseEntity.ok(conversation);
    }

    @GetMapping("/api/conversations/{conversationId}/messages")
    public ResponseEntity<Page<MessageDTO>> getMessages(
            @PathVariable String conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        String userId = userPrincipal.getUser().getId().toString();
        Pageable pageable = PageRequest.of(page, size);
        Page<MessageDTO> messages = chatService.getMessages(conversationId, userId, pageable);
        return ResponseEntity.ok(messages);
    }

    @PostMapping("/api/conversations/{conversationId}/messages")
    public ResponseEntity<MessageDTO> sendMessageREST(
            @PathVariable String conversationId,
            @Valid @RequestBody SendMessageRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        String userId = userPrincipal.getUser().getId().toString();
        request.setConversationId(conversationId);
        MessageDTO message = chatService.sendMessage(userId, request);

        messagingTemplate.convertAndSend("/topic/conversation/" + conversationId, message);
        return ResponseEntity.ok(message);
    }

    @DeleteMapping("/api/messages/{messageId}")
    public ResponseEntity<Void> deleteMessage(
            @PathVariable String messageId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        String userId = userPrincipal.getUser().getId().toString();
        chatService.deleteMessage(messageId, userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/api/conversations/{conversationId}/unread-count")
    public ResponseEntity<Integer> getUnreadCount(
            @PathVariable String conversationId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        String userId = userPrincipal.getUser().getId().toString();
        int count = chatService.getUnreadCount(conversationId, userId);
        return ResponseEntity.ok(count);
    }

    @GetMapping("/api/conversations/{conversationId}/typing")
    public ResponseEntity<List<String>> getTypingUsers(
            @PathVariable String conversationId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        String userId = userPrincipal.getUser().getId().toString();
        // Verify user is member of conversation
        if (!chatService.isMemberOfConversation(conversationId, userId)) {
            return ResponseEntity.status(403).build();
        }
        List<String> typingUserIds = chatService.getTypingUsers(conversationId);
        return ResponseEntity.ok(typingUserIds);
    }

    @PostMapping("/api/conversations/{conversationId}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable String conversationId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        String userId = userPrincipal.getUser().getId().toString();
        chatService.markMessagesAsRead(conversationId, userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/api/users/search")
    public ResponseEntity<List<UserSearchDTO>> searchUsers(
            @RequestParam String query,
            @RequestParam(defaultValue = "20") int limit) {
        List<User> users = userRepository.findByDisplayNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
                query, query, PageRequest.of(0, limit)
        );

        List<UserSearchDTO> result = users.stream()
                .map(user -> UserSearchDTO.builder()
                        .id(user.getId().toString())
                        .displayName(user.getDisplayName())
                        .email(user.getEmail())
                        .avatarUrl(user.getAvatarUrl())
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }
}
