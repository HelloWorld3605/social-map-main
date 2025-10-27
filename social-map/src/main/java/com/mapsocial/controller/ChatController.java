package com.mapsocial.controller;

import com.mapsocial.dto.ChatMessageDTO;
import com.mapsocial.dto.TypingDTO;
import com.mapsocial.dto.UnreadCountDTO;
import com.mapsocial.dto.request.CreateConversationRequest;
import com.mapsocial.dto.request.SendMessageRequest;
import com.mapsocial.dto.response.ConversationDTO;
import com.mapsocial.dto.response.MessageDTO;
import com.mapsocial.dto.response.UserSearchDTO;
import com.mapsocial.entity.User;
import com.mapsocial.exception.ChatException;
import com.mapsocial.repository.UserRepository;
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

    // ========== WEBSOCKET ENDPOINTS ==========

    /**
     * WebSocket endpoint - Gửi tin nhắn realtime
     * Backend tự động lấy senderId từ SecurityContext (JWT)
     */
    @MessageMapping("/sendMessage")
    public void sendMessage(@Payload ChatMessageDTO chatMessage,
                           @AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            // Lấy senderId từ JWT token thay vì từ request
            String senderId = userPrincipal.getUser().getId().toString();
            String conversationId = chatMessage.getConversationId();

            // Nếu không có conversationId → Tự động tạo conversation private
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

            // Gửi message qua service
            SendMessageRequest request = SendMessageRequest.builder()
                    .conversationId(conversationId)
                    .content(chatMessage.getContent())
                    .type(chatMessage.getMessageType())
                    .build();

            MessageDTO savedMessage = chatService.sendMessage(senderId, request);

            // Broadcast realtime đến conversation
            messagingTemplate.convertAndSend(
                    "/topic/conversation/" + conversationId,
                    savedMessage
            );

            // Gửi unread count cho các member khác
            final String finalConversationId = conversationId;
            final String finalSenderId = senderId;
            ConversationDTO conversation = chatService.getConversationById(finalConversationId, finalSenderId);
            conversation.getMembers().forEach(member -> {
                if (!member.getUserId().equals(finalSenderId)) {
                    int unreadCount = chatService.getUnreadCount(finalConversationId, member.getUserId());
                    UnreadCountDTO unreadDTO = new UnreadCountDTO(finalConversationId, unreadCount);
                    messagingTemplate.convertAndSendToUser(
                            member.getUserId(),
                            "/queue/unread",
                            unreadDTO
                    );
                }
            });

        } catch (Exception e) {
            String userId = userPrincipal.getUser().getId().toString();
            messagingTemplate.convertAndSendToUser(
                    userId,
                    "/queue/errors",
                    "Error: " + e.getMessage()
            );
        }
    }

    /**
     * WebSocket endpoint - Typing indicator
     * Backend tự động lấy userId từ SecurityContext (JWT)
     */
    @MessageMapping("/typing")
    public void handleTyping(@Payload TypingDTO typingDTO,
                            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            // Lấy userId từ JWT token thay vì từ request
            String userId = userPrincipal.getUser().getId().toString();
            String username = userPrincipal.getUser().getDisplayName();

            // Cập nhật typing status vào database
            chatService.setTypingStatus(
                    typingDTO.getConversationId(),
                    userId,
                    typingDTO.isTyping()
            );

            // Broadcast typing status với userId và username đã xác thực
            TypingDTO authenticatedTypingDTO = new TypingDTO(
                    typingDTO.getConversationId(),
                    userId,
                    username,  // Thêm username
                    typingDTO.isTyping()
            );

            messagingTemplate.convertAndSend(
                    "/topic/conversation/" + typingDTO.getConversationId() + "/typing",
                    authenticatedTypingDTO
            );
        } catch (Exception e) {
            // Silent fail for typing indicator
        }
    }

    // ========== REST API ENDPOINTS ==========

    /**
     * Lấy danh sách conversations của user hiện tại
     */
    @GetMapping("/api/conversations")
    public ResponseEntity<List<ConversationDTO>> getUserConversations(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        String userId = userPrincipal.getUser().getId().toString();
        List<ConversationDTO> conversations = chatService.getUserConversations(userId);
        return ResponseEntity.ok(conversations);
    }

    /**
     * Lấy conversation cụ thể
     */
    @GetMapping("/api/conversations/{conversationId}")
    public ResponseEntity<ConversationDTO> getConversation(
            @PathVariable String conversationId,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        String userId = userPrincipal.getUser().getId().toString();
        ConversationDTO conversation = chatService.getConversationById(conversationId, userId);
        return ResponseEntity.ok(conversation);
    }

    /**
     * Lấy hoặc tạo conversation private với user khác
     */
    @GetMapping("/api/conversations/private/{otherUserId}")
    public ResponseEntity<ConversationDTO> getOrCreatePrivateConversation(
            @PathVariable String otherUserId,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        String userId = userPrincipal.getUser().getId().toString();
        ConversationDTO conversation = chatService.getOrCreatePrivateConversation(userId, otherUserId);
        return ResponseEntity.ok(conversation);
    }

    /**
     * Tạo conversation mới (nhóm hoặc private)
     */
    @PostMapping("/api/conversations")
    public ResponseEntity<ConversationDTO> createConversation(
            @Valid @RequestBody CreateConversationRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        String userId = userPrincipal.getUser().getId().toString();
        ConversationDTO conversation = chatService.createConversation(request, userId);
        return ResponseEntity.ok(conversation);
    }

    /**
     * Cập nhật thông tin group chat
     */
    @PutMapping("/api/conversations/{conversationId}/group-info")
    public ResponseEntity<ConversationDTO> updateGroupInfo(
            @PathVariable String conversationId,
            @RequestParam(required = false) String groupName,
            @RequestParam(required = false) String groupAvatar,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        String userId = userPrincipal.getUser().getId().toString();
        ConversationDTO conversation = chatService.updateGroupInfo(conversationId, userId, groupName, groupAvatar);
        return ResponseEntity.ok(conversation);
    }

    /**
     * Lấy lịch sử tin nhắn của conversation (phân trang)
     */
    @GetMapping("/api/conversations/{conversationId}/messages")
    public ResponseEntity<Page<MessageDTO>> getMessages(
            @PathVariable String conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        String userId = userPrincipal.getUser().getId().toString();
        Pageable pageable = PageRequest.of(page, size);
        Page<MessageDTO> messages = chatService.getMessages(conversationId, userId, pageable);
        return ResponseEntity.ok(messages);
    }

    /**
     * Lấy tin nhắn mới (chưa đọc)
     */
    @GetMapping("/api/conversations/{conversationId}/messages/new")
    public ResponseEntity<List<MessageDTO>> getNewMessages(
            @PathVariable String conversationId,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        String userId = userPrincipal.getUser().getId().toString();
        List<MessageDTO> messages = chatService.getNewMessages(conversationId, userId);
        return ResponseEntity.ok(messages);
    }

    /**
     * Gửi tin nhắn (REST API)
     */
    @PostMapping("/api/conversations/{conversationId}/messages")
    public ResponseEntity<MessageDTO> sendMessageREST(
            @PathVariable String conversationId,
            @Valid @RequestBody SendMessageRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        String userId = userPrincipal.getUser().getId().toString();
        request.setConversationId(conversationId);
        MessageDTO message = chatService.sendMessage(userId, request);

        // Broadcast qua WebSocket
        messagingTemplate.convertAndSend(
                "/topic/conversation/" + conversationId,
                message
        );

        return ResponseEntity.ok(message);
    }

    /**
     * Sửa tin nhắn
     */
    @PutMapping("/api/messages/{messageId}")
    public ResponseEntity<MessageDTO> editMessage(
            @PathVariable String messageId,
            @RequestParam String content,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        String userId = userPrincipal.getUser().getId().toString();
        MessageDTO message = chatService.editMessage(messageId, userId, content);

        // Broadcast update qua WebSocket
        messagingTemplate.convertAndSend(
                "/topic/conversation/" + message.getConversationId() + "/update",
                message
        );

        return ResponseEntity.ok(message);
    }

    /**
     * Xóa tin nhắn
     */
    @DeleteMapping("/api/messages/{messageId}")
    public ResponseEntity<Void> deleteMessage(
            @PathVariable String messageId,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        String userId = userPrincipal.getUser().getId().toString();
        chatService.deleteMessage(messageId, userId);
        return ResponseEntity.ok().build();
    }

    /**
     * Search tin nhắn trong conversation
     */
    @GetMapping("/api/conversations/{conversationId}/messages/search")
    public ResponseEntity<List<MessageDTO>> searchMessages(
            @PathVariable String conversationId,
            @RequestParam String query,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        String userId = userPrincipal.getUser().getId().toString();
        List<MessageDTO> messages = chatService.searchMessages(conversationId, query, userId);
        return ResponseEntity.ok(messages);
    }

    /**
     * Đánh dấu tin nhắn đã đọc
     */
    @PostMapping("/api/conversations/{conversationId}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable String conversationId,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        String userId = userPrincipal.getUser().getId().toString();
        chatService.markMessagesAsRead(conversationId, userId);
        return ResponseEntity.ok().build();
    }

    /**
     * Lấy số tin nhắn chưa đọc
     */
    @GetMapping("/api/conversations/{conversationId}/unread-count")
    public ResponseEntity<Integer> getUnreadCount(
            @PathVariable String conversationId,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        String userId = userPrincipal.getUser().getId().toString();
        int count = chatService.getUnreadCount(conversationId, userId);
        return ResponseEntity.ok(count);
    }

    /**
     * Lấy danh sách users đang typing
     */
    @GetMapping("/api/conversations/{conversationId}/typing")
    public ResponseEntity<List<String>> getTypingUsers(@PathVariable String conversationId) {
        List<String> typingUsers = chatService.getTypingUsers(conversationId);
        return ResponseEntity.ok(typingUsers);
    }

    /**
     * Search users/friends để chat
     */
    @GetMapping("/api/chat/search-users")
    public ResponseEntity<List<ConversationDTO>> searchUsersToChat(
            @RequestParam String query,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        String userId = userPrincipal.getUser().getId().toString();
        List<ConversationDTO> conversations = chatService.searchUsers(userId, query);
        return ResponseEntity.ok(conversations);
    }

    /**
     * Search users (general)
     */
    @GetMapping("/api/users/search")
    public ResponseEntity<List<UserSearchDTO>> searchUsers(
            @RequestParam String query,
            @RequestParam(defaultValue = "20") int limit
    ) {
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

    /**
     * Thêm member vào group chat
     */
    @PostMapping("/api/conversations/{conversationId}/members/{memberId}")
    public ResponseEntity<ConversationDTO> addMember(
            @PathVariable String conversationId,
            @PathVariable String memberId,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        String userId = userPrincipal.getUser().getId().toString();
        ConversationDTO conversation = chatService.addMemberToConversation(conversationId, memberId, userId);
        return ResponseEntity.ok(conversation);
    }

    /**
     * Xóa member khỏi group chat
     */
    @DeleteMapping("/api/conversations/{conversationId}/members/{memberId}")
    public ResponseEntity<Void> removeMember(
            @PathVariable String conversationId,
            @PathVariable String memberId,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        String userId = userPrincipal.getUser().getId().toString();
        chatService.removeMemberFromConversation(conversationId, memberId, userId);
        return ResponseEntity.ok().build();
    }

    /**
     * Rời khỏi group chat
     */
    @PostMapping("/api/conversations/{conversationId}/leave")
    public ResponseEntity<Void> leaveConversation(
            @PathVariable String conversationId,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        String userId = userPrincipal.getUser().getId().toString();
        chatService.leaveConversation(conversationId, userId);
        return ResponseEntity.ok().build();
    }
}
