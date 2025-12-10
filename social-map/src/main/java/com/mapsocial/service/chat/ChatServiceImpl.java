package com.mapsocial.service.chat;

import com.mapsocial.dto.ReadReceiptDTO;
import com.mapsocial.dto.UnreadCountDTO;
import com.mapsocial.dto.request.CreateConversationRequest;
import com.mapsocial.dto.request.SendMessageRequest;
import com.mapsocial.dto.response.ConversationDTO;
import com.mapsocial.dto.response.ConversationMemberDTO;
import com.mapsocial.dto.response.MessageDTO;
import com.mapsocial.entity.Chat.Conversation;
import com.mapsocial.entity.Chat.ConversationMember;
import com.mapsocial.entity.Chat.Message;
import com.mapsocial.entity.Friendship;
import com.mapsocial.entity.User;
import com.mapsocial.enums.FriendshipStatus;
import com.mapsocial.enums.MessageStatus;
import com.mapsocial.enums.MessageType;
import com.mapsocial.exception.ChatException;
import com.mapsocial.repository.ConversationMemberRepository;
import com.mapsocial.repository.ConversationRepository;
import com.mapsocial.repository.FriendshipRepository;
import com.mapsocial.repository.MessageRepository;
import com.mapsocial.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.redis.core.RedisTemplate;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final ConversationMemberRepository conversationMemberRepository;
    private final UserRepository userRepository;
    private final FriendshipRepository friendshipRepository;
    private final SimpMessagingTemplate messagingTemplate;
    @Autowired(required = false)
    private RedisTemplate<String, Object> redisTemplate;

    private static final String CONVERSATION_NOT_FOUND = "Không tìm thấy cuộc trò chuyện";
    private static final String USER_NOT_IN_CONVERSATION = "Không tìm thấy người dùng trong cuộc trò chuyện";
    private static final String REQUESTER_NOT_IN_CONVERSATION = "Người yêu cầu không thuộc cuộc trò chuyện";
    private static final String ROLE_ADMIN = "ADMIN";
    private static final String ROLE_MEMBER = "MEMBER";
    private static final String UNKNOWN_USER = "Không xác định";

    @Override
    @Transactional
    public MessageDTO sendMessage(String senderId, SendMessageRequest request) {
        if (request.getContent() == null || request.getContent().trim().isEmpty()) {
            throw new ChatException("Nội dung tin nhắn không được để trống");
        }
        if (request.getContent().length() > 5000) {
            throw new ChatException("Tin nhắn quá dài (tối đa 5000 ký tự)");
        }
        if (!isMemberOfConversation(request.getConversationId(), senderId)) {
            throw new ChatException("Người dùng không thuộc cuộc trò chuyện này");
        }

        Message message = Message.builder()
                .conversationId(request.getConversationId())
                .senderId(senderId)
                .content(request.getContent().trim())
                .type(request.getType() != null ? request.getType() : MessageType.TEXT)
                .replyToMessageId(request.getReplyToMessageId())
                .attachmentUrls(request.getAttachmentUrls())
                .createdAt(LocalDateTime.now())
                .deleted(false)
                .edited(false)
                .build();

        Message savedMessage = messageRepository.save(message);

        // Set initial status to DELIVERED in Redis (assuming sent via WebSocket means delivered)
        if (redisTemplate != null) {
            String statusKey = "message:status:" + savedMessage.getId();
            redisTemplate.opsForValue().set(statusKey, MessageStatus.DELIVERED.name());
        }

        Conversation conversation = conversationRepository.findById(request.getConversationId())
                .orElseThrow(() -> new ChatException(CONVERSATION_NOT_FOUND));
        conversation.setLastMessageAt(LocalDateTime.now());
        conversation.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        ConversationMember senderMember = conversationMemberRepository
                .findByConversationIdAndUserId(request.getConversationId(), senderId)
                .orElseThrow(() -> new ChatException("Người gửi không tìm thấy trong cu��c trò chuyện"));
        senderMember.setLastActiveAt(LocalDateTime.now());
        conversationMemberRepository.save(senderMember);

        return mapToMessageDTO(savedMessage);
    }

    @Override
    @Transactional
    public MessageDTO editMessage(String messageId, String userId, String newContent) {
        Message message = messageRepository.findByIdAndDeletedFalse(messageId)
                .orElseThrow(() -> new ChatException("Không tìm thấy tin nhắn"));

        if (!message.getSenderId().equals(userId)) {
            throw new ChatException("Bạn chỉ có thể sửa tin nhắn của mình");
        }

        if (newContent == null || newContent.trim().isEmpty()) {
            throw new ChatException("Nội dung tin nhắn không được để trống");
        }

        message.setContent(newContent.trim());
        message.setEdited(true);
        message.setUpdatedAt(LocalDateTime.now());

        return mapToMessageDTO(messageRepository.save(message));
    }

    @Override
    @Transactional
    public void deleteMessage(String messageId, String userId) {
        Message message = messageRepository.findByIdAndDeletedFalse(messageId)
                .orElseThrow(() -> new ChatException("Không tìm thấy tin nhắn"));

        if (!message.getSenderId().equals(userId)) {
            throw new ChatException("Bạn chỉ có thể xóa tin nhắn của mình");
        }

        message.setDeleted(true);
        message.setUpdatedAt(LocalDateTime.now());
        messageRepository.save(message);
    }

    @Override
    @Transactional
    public ConversationDTO createConversation(CreateConversationRequest request, String createdBy) {
        if (request.getMemberIds() == null || request.getMemberIds().isEmpty()) {
            throw new ChatException("Cần ít nhất một thành viên");
        }

        if (!request.isGroup() && request.getMemberIds().size() == 1 &&
            request.getMemberIds().get(0).equals(createdBy)) {
            throw new ChatException("Không thể tạo cuộc trò chuyện ri��ng với chính mình");
        }

        if (!request.getMemberIds().contains(createdBy)) {
            request.getMemberIds().add(createdBy);
        }

        if (!request.isGroup() && request.getMemberIds().size() == 2) {
            String otherUserId = request.getMemberIds().stream()
                    .filter(id -> !id.equals(createdBy))
                    .findFirst()
                    .orElse(null);

            if (otherUserId != null) {
                Optional<ConversationDTO> existing = findExistingPrivateConversation(createdBy, otherUserId);
                if (existing.isPresent()) {
                    return existing.get();
                }
            }
        }

        Conversation conversation = Conversation.builder()
                .isGroup(request.isGroup())
                .groupName(request.getGroupName())
                .groupAvatar(request.getGroupAvatar())
                .createdBy(createdBy)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        Conversation savedConversation = conversationRepository.save(conversation);

        for (String memberId : request.getMemberIds()) {
            String role = memberId.equals(createdBy) ? ROLE_ADMIN : ROLE_MEMBER;

            ConversationMember member = ConversationMember.builder()
                    .conversationId(savedConversation.getId())
                    .userId(memberId)
                    .role(role)
                    .joinedAt(LocalDateTime.now())
                    .lastReadAt(LocalDateTime.now())
                    .lastActiveAt(LocalDateTime.now())
                    .active(true)
                    .deleted(false)
                    .typing(false)
                    .build();
            conversationMemberRepository.save(member);
        }

        return mapToConversationDTO(savedConversation, createdBy);
    }

    @Override
    @Transactional
    public ConversationDTO getOrCreatePrivateConversation(String userId1, String userId2) {
        Optional<ConversationDTO> existing = findExistingPrivateConversation(userId1, userId2);
        if (existing.isPresent()) {
            return existing.get();
        }

        CreateConversationRequest request = CreateConversationRequest.builder()
                .memberIds(Arrays.asList(userId1, userId2))
                .isGroup(false)
                .build();

        return createConversation(request, userId1);
    }

    @Override
    public List<ConversationDTO> getUserConversations(String userId) {
        List<ConversationMember> members = conversationMemberRepository.findActiveConversationsByUserId(userId);

        return members.stream()
                .map(member -> {
                    Conversation conv = conversationRepository.findById(member.getConversationId())
                            .orElse(null);
                    if (conv == null) return null;

                    // If user cleared chat, check if there are new messages after clearedAt
                    if (member.getClearedAt() != null) {
                        // Check if last message is after clearedAt
                        if (conv.getLastMessageAt() == null ||
                            conv.getLastMessageAt().isBefore(member.getClearedAt()) ||
                            conv.getLastMessageAt().isEqual(member.getClearedAt())) {
                            // No new messages after clear - hide this conversation
                            return null;
                        }
                    }

                    return mapToConversationDTO(conv, userId);
                })
                .filter(Objects::nonNull)
                .sorted((c1, c2) -> {
                    if (c1.getLastMessageAt() == null) return 1;
                    if (c2.getLastMessageAt() == null) return -1;
                    return c2.getLastMessageAt().compareTo(c1.getLastMessageAt());
                })
                .collect(Collectors.toList());
    }

    @Override
    public ConversationDTO getConversationById(String conversationId, String userId) {
        if (!isMemberOfConversation(conversationId, userId)) {
            throw new ChatException("Người dùng không thuộc cuộc trò chuyện này");
        }

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ChatException(CONVERSATION_NOT_FOUND));

        return mapToConversationDTO(conversation, userId);
    }

    @Override
    @Transactional
    public ConversationDTO addMemberToConversation(String conversationId, String userId, String requesterId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ChatException(CONVERSATION_NOT_FOUND));

        if (!conversation.isGroup()) {
            throw new ChatException("Không thể thêm thành viên vào cuộc trò chuyện riêng");
        }

        ConversationMember requester = conversationMemberRepository
                .findByConversationIdAndUserId(conversationId, requesterId)
                .orElseThrow(() -> new ChatException(REQUESTER_NOT_IN_CONVERSATION));

        if (!ROLE_ADMIN.equals(requester.getRole())) {
            throw new ChatException("Chỉ quản trị viên mới được thêm thành viên");
        }

        if (conversationMemberRepository.existsByConversationIdAndUserIdAndActive(conversationId, userId)) {
            throw new ChatException("Người dùng đã là thành viên");
        }

        ConversationMember member = ConversationMember.builder()
                .conversationId(conversationId)
                .userId(userId)
                .role(ROLE_MEMBER)
                .joinedAt(LocalDateTime.now())
                .lastReadAt(LocalDateTime.now())
                .lastActiveAt(LocalDateTime.now())
                .active(true)
                .deleted(false)
                .typing(false)
                .build();
        conversationMemberRepository.save(member);

        conversation.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        return mapToConversationDTO(conversation, requesterId);
    }

    @Override
    @Transactional
    public void removeMemberFromConversation(String conversationId, String userId, String requesterId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ChatException(CONVERSATION_NOT_FOUND));

        if (!conversation.isGroup()) {
            throw new ChatException("Không thể xóa thành viên khỏi cuộc trò chuyện riêng");
        }

        ConversationMember requester = conversationMemberRepository
                .findByConversationIdAndUserId(conversationId, requesterId)
                .orElseThrow(() -> new ChatException(REQUESTER_NOT_IN_CONVERSATION));

        if (!ROLE_ADMIN.equals(requester.getRole())) {
            throw new ChatException("Chỉ quản trị viên mới được xóa thành viên");
        }

        ConversationMember member = conversationMemberRepository
                .findByConversationIdAndUserId(conversationId, userId)
                .orElseThrow(() -> new ChatException(USER_NOT_IN_CONVERSATION));

        member.setActive(false);
        member.setLastActiveAt(LocalDateTime.now());
        conversationMemberRepository.save(member);

        conversation.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conversation);
    }

    @Override
    @Transactional
    public void leaveConversation(String conversationId, String userId) {
        ConversationMember member = conversationMemberRepository
                .findByConversationIdAndUserId(conversationId, userId)
                .orElseThrow(() -> new ChatException(USER_NOT_IN_CONVERSATION));

        member.setActive(false);
        member.setLastActiveAt(LocalDateTime.now());
        conversationMemberRepository.save(member);
    }

    @Override
    @Transactional
    public ConversationDTO updateGroupInfo(String conversationId, String requesterId, String groupName, String groupAvatar) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ChatException(CONVERSATION_NOT_FOUND));

        if (!conversation.isGroup()) {
            throw new ChatException("Không thể cập nhật thông tin cho cuộc trò chuyện riêng");
        }

        ConversationMember requester = conversationMemberRepository
                .findByConversationIdAndUserId(conversationId, requesterId)
                .orElseThrow(() -> new ChatException(REQUESTER_NOT_IN_CONVERSATION));

        if (!ROLE_ADMIN.equals(requester.getRole())) {
            throw new ChatException("Chỉ quản trị viên mới được cập nhật thông tin nhóm");
        }

        if (groupName != null) {
            conversation.setGroupName(groupName);
        }
        if (groupAvatar != null) {
            conversation.setGroupAvatar(groupAvatar);
        }
        conversation.setUpdatedAt(LocalDateTime.now());

        conversationRepository.save(conversation);
        return mapToConversationDTO(conversation, requesterId);
    }

    @Override
    public Page<MessageDTO> getMessages(String conversationId, String userId, Pageable pageable) {
        ConversationMember member = conversationMemberRepository
                .findByConversationIdAndUserId(conversationId, userId)
                .orElseThrow(() -> new ChatException("Người dùng không thuộc cuộc trò chuyện này"));

        Page<Message> messages;

        // If user has cleared chat, only show messages after clearedAt
        if (member.getClearedAt() != null) {
            messages = messageRepository.findByConversationIdAndCreatedAtAfterAndDeletedFalseOrderByCreatedAtDesc(
                    conversationId, member.getClearedAt(), pageable);
        } else {
            messages = messageRepository.findByConversationIdAndDeletedFalseOrderByCreatedAtDesc(
                    conversationId, pageable);
        }

        List<MessageDTO> messageDTOs = messages.stream()
                .map(this::mapToMessageDTO)
                .collect(Collectors.toList());

        return new PageImpl<>(messageDTOs, pageable, messages.getTotalElements());
    }

    @Override
    public List<MessageDTO> getNewMessages(String conversationId, String userId) {
        ConversationMember member = conversationMemberRepository
                .findByConversationIdAndUserId(conversationId, userId)
                .orElseThrow(() -> new ChatException(USER_NOT_IN_CONVERSATION));

        LocalDateTime lastReadAt = member.getLastReadAt() != null ?
                member.getLastReadAt() : member.getJoinedAt();

        List<Message> newMessages = messageRepository.findNewMessages(conversationId, lastReadAt);

        return newMessages.stream()
                .map(this::mapToMessageDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void markMessagesAsRead(String conversationId, String userId) {
        // 1. Get member and old lastReadAt
        ConversationMember member = conversationMemberRepository
                .findByConversationIdAndUserId(conversationId, userId)
                .orElseThrow(() -> new ChatException(USER_NOT_IN_CONVERSATION));

        LocalDateTime oldLastReadAt = member.getLastReadAt() != null ?
                member.getLastReadAt() : member.getJoinedAt();

        // 2. Get user info for read receipt
        User currentUser = userRepository.findById(UUID.fromString(userId)).orElse(null);
        String userName = UNKNOWN_USER;
        String userAvatar = null;
        if (currentUser != null) {
            userName = currentUser.getDisplayName() != null ? currentUser.getDisplayName() : currentUser.getEmail();
            userAvatar = currentUser.getAvatarUrl();
        }

        // 3. Get unread messages to update their status
        List<Message> unreadMessages = messageRepository.findNewMessages(conversationId, oldLastReadAt);

        // 4. Update message status in Redis for messages sent by others
        List<com.mapsocial.dto.MessageStatusUpdateDTO> statusUpdates = new ArrayList<>();

        for (Message message : unreadMessages) {
            // Don't update status for messages sent by current user
            if (message.getSenderId().equals(userId)) {
                continue;
            }

            String statusKey = "message:status:" + message.getId();
            String seenByKey = "message:seenBy:" + message.getId();

            // Check if already seen in Redis
            Object existingSeen = redisTemplate != null ? redisTemplate.opsForHash().get(seenByKey, userId) : null;
            if (existingSeen != null) {
                continue; // Already seen
            }

            // Store seen in Redis
            if (redisTemplate != null) {
                redisTemplate.opsForHash().put(seenByKey, userId, LocalDateTime.now().toString());
                // Set TTL for seenBy (24-48 hours, let's use 36 hours)
                redisTemplate.expire(seenByKey, java.time.Duration.ofHours(36));

                // Update status to SEEN in Redis
                redisTemplate.opsForValue().set(statusKey, com.mapsocial.enums.MessageStatus.SEEN.name());
            }

            // Get current seenBy from Redis for DTO
            Map<Object, Object> seenByMap = redisTemplate != null ? redisTemplate.opsForHash().entries(seenByKey) : new HashMap<>();
            List<com.mapsocial.dto.MessageSeenByDTO> seenByDTOs = seenByMap.entrySet().stream()
                    .map(entry -> {
                        String uid = (String) entry.getKey();
                        LocalDateTime seenAt = LocalDateTime.parse((String) entry.getValue());
                        User u = userRepository.findById(UUID.fromString(uid)).orElse(null);
                        String uName = u != null ? (u.getDisplayName() != null ? u.getDisplayName() : u.getEmail()) : UNKNOWN_USER;
                        String uAvatar = u != null ? u.getAvatarUrl() : null;
                        return com.mapsocial.dto.MessageSeenByDTO.builder()
                                .userId(uid)
                                .userName(uName)
                                .userAvatar(uAvatar)
                                .seenAt(seenAt)
                                .build();
                    })
                    .collect(Collectors.toList());

            com.mapsocial.dto.MessageStatusUpdateDTO statusUpdate = com.mapsocial.dto.MessageStatusUpdateDTO.builder()
                    .messageId(message.getId())
                    .conversationId(conversationId)
                    .status(com.mapsocial.enums.MessageStatus.SEEN)
                    .seenBy(seenByDTOs)
                    .updatedAt(LocalDateTime.now())
                    .build();

            statusUpdates.add(statusUpdate);

            // Broadcast status update to message sender
            messagingTemplate.convertAndSendToUser(
                    message.getSenderId(),
                    "/queue/message-status",
                    statusUpdate
            );
        }

        // 5. Update member lastReadAt after processing
        member.setLastReadAt(LocalDateTime.now());
        member.setLastActiveAt(LocalDateTime.now());
        conversationMemberRepository.save(member);

        // 6. Send read receipt to other members
        // Only send if there were unread messages
        if (unreadMessages.isEmpty()) {
            return; // No need to send read receipt if no messages were marked as read
        }

        String lastReadMessageId = unreadMessages.get(unreadMessages.size() - 1).getId();

        List<ConversationMember> otherMembers = conversationMemberRepository
                .findByConversationIdAndUserIdNotAndDeletedFalse(conversationId, userId);

        for (ConversationMember otherMember : otherMembers) {
            // Send read receipt with ALL required fields
            ReadReceiptDTO receipt = new ReadReceiptDTO();
            receipt.setConversationId(conversationId);  // 🆕 Set conversationId
            receipt.setLastMessageId(lastReadMessageId); // 🆕 Set lastMessageId
            receipt.setReadByUserId(userId);
            receipt.setReadByUserName(userName);
            receipt.setReadByUserAvatar(userAvatar);
            receipt.setReadAt(LocalDateTime.now());

            messagingTemplate.convertAndSendToUser(
                    otherMember.getUserId(),
                    "/queue/read-receipt",
                    receipt
            );
        }
    }

    @Override
    public int getUnreadCount(String conversationId, String userId) {
        ConversationMember member = conversationMemberRepository
                .findByConversationIdAndUserId(conversationId, userId)
                .orElse(null);

        if (member == null) {
            return 0;
        }

        LocalDateTime lastReadAt = member.getLastReadAt() != null ?
                member.getLastReadAt() : member.getJoinedAt();

        // If user cleared chat, use clearedAt as the minimum time boundary
        if (member.getClearedAt() != null && member.getClearedAt().isAfter(lastReadAt)) {
            lastReadAt = member.getClearedAt();
        }

        return (int) messageRepository.countUnreadMessages(conversationId, lastReadAt, userId);
    }

    @Override
    @Transactional
    public void markAsUnread(String conversationId, String userId) {
        ConversationMember member = conversationMemberRepository
                .findByConversationIdAndUserId(conversationId, userId)
                .orElseThrow(() -> new ChatException(USER_NOT_IN_CONVERSATION));

        // Find the last message in conversation
        Optional<Message> lastMessageOpt = messageRepository.findTop1ByConversationIdAndDeletedFalseOrderByCreatedAtDesc(conversationId);

        if (lastMessageOpt.isPresent()) {
            Message lastMessage = lastMessageOpt.get();
            // Set lastReadAt to 1 second before the last message
            member.setLastReadAt(lastMessage.getCreatedAt().minusSeconds(1));
        } else {
            // No messages, set to joinedAt minus 1 second
            member.setLastReadAt(member.getJoinedAt().minusSeconds(1));
        }

        conversationMemberRepository.save(member);
    }

    @Override
    @Transactional
    public void muteConversation(String conversationId, String userId, boolean mute) {
        ConversationMember member = conversationMemberRepository
                .findByConversationIdAndUserId(conversationId, userId)
                .orElseThrow(() -> new ChatException(USER_NOT_IN_CONVERSATION));

        member.setMuted(mute);
        member.setMutedAt(mute ? LocalDateTime.now() : null);
        conversationMemberRepository.save(member);
    }

    @Override
    public boolean isConversationMuted(String conversationId, String userId) {
        ConversationMember member = conversationMemberRepository
                .findByConversationIdAndUserId(conversationId, userId)
                .orElse(null);

        return member != null && member.isMuted();
    }

    @Override
    @Transactional
    public void deleteConversation(String conversationId, String userId) {
        ConversationMember member = conversationMemberRepository
                .findByConversationIdAndUserId(conversationId, userId)
                .orElseThrow(() -> new ChatException(USER_NOT_IN_CONVERSATION));

        // Clear chat history for this user only (like Facebook)
        // User stays in conversation but won't see messages before this time
        member.setClearedAt(LocalDateTime.now());
        // Also reset unread count by setting lastReadAt to now
        member.setLastReadAt(LocalDateTime.now());
        conversationMemberRepository.save(member);
    }

    @Override
    @Transactional
    public void setTypingStatus(String conversationId, String userId, boolean isTyping) {
        ConversationMember member = conversationMemberRepository
                .findByConversationIdAndUserId(conversationId, userId)
                .orElseThrow(() -> new ChatException(USER_NOT_IN_CONVERSATION));

        member.setTyping(isTyping);
        member.setTypingStartedAt(isTyping ? LocalDateTime.now() : null);
        conversationMemberRepository.save(member);
    }

    @Override
    public List<String> getTypingUsers(String conversationId) {
        List<ConversationMember> typingMembers = conversationMemberRepository.findTypingMembers(conversationId);

        LocalDateTime fiveSecondsAgo = LocalDateTime.now().minusSeconds(5);

        return typingMembers.stream()
                .filter(m -> m.getTypingStartedAt() != null &&
                           m.getTypingStartedAt().isAfter(fiveSecondsAgo))
                .map(ConversationMember::getUserId)
                .collect(Collectors.toList());
    }

    @Override
    public List<MessageDTO> searchMessages(String conversationId, String searchText, String userId) {
        if (!isMemberOfConversation(conversationId, userId)) {
            throw new ChatException("Người dùng không thuộc cuộc trò chuyện này");
        }

        List<Message> messages = messageRepository.searchInConversation(conversationId, searchText);

        return messages.stream()
                .map(this::mapToMessageDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<ConversationDTO> searchUsers(String userId, String searchText) {
        User currentUser = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new ChatException("Không tìm thấy người dùng"));

        List<Friendship> friendships = friendshipRepository.findBySenderOrReceiverAndStatus(
                currentUser, currentUser, FriendshipStatus.ACCEPTED);

        return friendships.stream()
                .map(friendship -> {
                    User friend = friendship.getSender().getId().toString().equals(userId) ?
                            friendship.getReceiver() : friendship.getSender();

                    String displayName = friend.getDisplayName() != null ? friend.getDisplayName() : friend.getEmail();
                    if (!displayName.toLowerCase().contains(searchText.toLowerCase())) {
                        return null;
                    }

                    return getOrCreatePrivateConversation(userId, friend.getId().toString());
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    @Override
    public boolean isMemberOfConversation(String conversationId, String userId) {
        return conversationMemberRepository.existsByConversationIdAndUserIdAndActive(conversationId, userId);
    }

    private Optional<ConversationDTO> findExistingPrivateConversation(String userId1, String userId2) {
        // 1. Lấy danh sách (active) conversation IDs của user 1
        Set<String> user1ConvIds = conversationMemberRepository.findActiveConversationsByUserId(userId1)
                .stream()
                .map(ConversationMember::getConversationId)
                .collect(Collectors.toSet());

        if (user1ConvIds.isEmpty()) {
            return Optional.empty();
        }

        // 2. Lấy danh sách (active) conversation IDs của user 2
        Set<String> user2ConvIds = conversationMemberRepository.findActiveConversationsByUserId(userId2)
                .stream()
                .map(ConversationMember::getConversationId)
                .collect(Collectors.toSet());

        // 3. Tìm các conversation chung (giao của 2 tập hợp)
        user1ConvIds.retainAll(user2ConvIds); // user1ConvIds giờ chỉ chứa các ID chung
        Set<String> commonConvIds = user1ConvIds;

        if (commonConvIds.isEmpty()) {
            return Optional.empty(); // Không có conversation chung
        }

        // 4. Lọc các conversation chung, chỉ lấy cái nào là 1-1 (isGroup = false)
        for (String convId : commonConvIds) {
            Conversation conv = conversationRepository.findById(convId).orElse(null);

            // Nếu tìm thấy conversation và nó KHÔNG PHẢI group
            if (conv != null && !conv.isGroup()) {

                // Kiểm tra thêm cho chắc chắn là chỉ có 2 thành viên active
                // (Phòng trường hợp data cũ có lỗi)
                long activeMembers = conversationMemberRepository.countActiveByConversationId(convId);

                if (activeMembers == 2) {
                    // Đây chính là conversation 1-1
                    return Optional.of(mapToConversationDTO(conv, userId1));
                }
            }
        }

        // Không tìm thấy conversation 1-1 nào phù hợp
        return Optional.empty();
    }

    private ConversationDTO mapToConversationDTO(Conversation conversation, String currentUserId) {
        List<ConversationMember> members = conversationMemberRepository.findByConversationId(conversation.getId());
        List<ConversationMemberDTO> memberDTOs = members.stream()
                .filter(ConversationMember::isActive)
                .map(this::mapToConversationMemberDTO)
                .collect(Collectors.toList());

        Optional<Message> lastMessage = messageRepository.findTop1ByConversationIdAndDeletedFalseOrderByCreatedAtDesc(
                conversation.getId());

        String lastMessageContent = null;
        String lastMessageSenderId = null;
        List<String> lastMessageSeenByUserIds = null;
        if (lastMessage.isPresent()) {
            Message msg = lastMessage.get();
            lastMessageContent = msg.getContent();
            lastMessageSenderId = msg.getSenderId();
            // Get seenBy userIds
            if (redisTemplate != null) {
                String seenByKey = "message:seenBy:" + msg.getId();
                Map<Object, Object> seenByMap = redisTemplate.opsForHash().entries(seenByKey);
                lastMessageSeenByUserIds = seenByMap.keySet().stream()
                        .map(Object::toString)
                        .collect(Collectors.toList());
            } else {
                lastMessageSeenByUserIds = msg.getSeenBy().stream()
                        .map(com.mapsocial.entity.Chat.MessageSeenBy::getUserId)
                        .collect(Collectors.toList());
            }
        }

        int unreadCount = getUnreadCount(conversation.getId(), currentUserId);
        List<String> typingUserIds = getTypingUsers(conversation.getId());
        boolean isMuted = isConversationMuted(conversation.getId(), currentUserId);

        return ConversationDTO.builder()
                .id(conversation.getId())
                .isGroup(conversation.isGroup())
                .groupName(conversation.getGroupName())
                .groupAvatar(conversation.getGroupAvatar())
                .lastMessageContent(lastMessageContent)
                .lastMessageSenderId(lastMessageSenderId)
                .lastMessageAt(conversation.getLastMessageAt())
                .lastMessageSeenByUserIds(lastMessageSeenByUserIds)
                .unreadCount(unreadCount)
                .isMuted(isMuted)
                .members(memberDTOs)
                .typingUserIds(typingUserIds)
                .createdAt(conversation.getCreatedAt())
                .build();
    }

    private ConversationMemberDTO mapToConversationMemberDTO(ConversationMember member) {
        User user = userRepository.findById(UUID.fromString(member.getUserId())).orElse(null);

        String displayName = UNKNOWN_USER;
        String avatar = null;

        if (user != null) {
            displayName = user.getDisplayName() != null ? user.getDisplayName() : user.getEmail();
            avatar = user.getAvatarUrl();
        }

        return ConversationMemberDTO.builder()
                .userId(member.getUserId())
                .username(displayName)
                .fullName(displayName)
                .avatarUrl(avatar)
                .role(member.getRole())
                .lastReadAt(member.getLastReadAt())
                .joinedAt(member.getJoinedAt())
                .isActive(member.isActive())
                .isTyping(member.isTyping())
                .isOnline(user != null ? Boolean.TRUE.equals(user.getIsOnline()) : false)
                .build();
    }

    private MessageDTO mapToMessageDTO(Message message) {
        User sender = userRepository.findById(UUID.fromString(message.getSenderId())).orElse(null);

        String senderName = UNKNOWN_USER;
        String senderAvatar = null;
        if (sender != null) {
            senderName = sender.getDisplayName() != null ? sender.getDisplayName() : sender.getEmail();
            senderAvatar = sender.getAvatarUrl();
        }

        MessageDTO replyToMessage = null;
        if (message.getReplyToMessageId() != null) {
            Optional<Message> replyMsg = messageRepository.findByIdAndDeletedFalse(message.getReplyToMessageId());
            if (replyMsg.isPresent()) {
                Message reply = replyMsg.get();
                User replySender = userRepository.findById(UUID.fromString(reply.getSenderId())).orElse(null);

                String replySenderName = UNKNOWN_USER;
                if (replySender != null) {
                    replySenderName = replySender.getDisplayName() != null ?
                            replySender.getDisplayName() : replySender.getEmail();
                }

                replyToMessage = MessageDTO.builder()
                        .id(reply.getId())
                        .senderId(reply.getSenderId())
                        .senderName(replySenderName)
                        .content(reply.getContent())
                        .type(reply.getType())
                        .createdAt(reply.getCreatedAt())
                        .build();
            }
        }

        // Get status from Redis first, fallback to DB
        String statusKey = "message:status:" + message.getId();
        String statusStr = redisTemplate != null ? (String) redisTemplate.opsForValue().get(statusKey) : null;
        com.mapsocial.enums.MessageStatus status = message.getStatus() != null ? message.getStatus() : com.mapsocial.enums.MessageStatus.SENT;
        if (statusStr != null) {
            try {
                status = com.mapsocial.enums.MessageStatus.valueOf(statusStr);
            } catch (IllegalArgumentException e) {
                // Invalid status, use default
            }
        }

        // Get seenBy from Redis
        String seenByKey = "message:seenBy:" + message.getId();
        Map<Object, Object> seenByMap = redisTemplate != null ? redisTemplate.opsForHash().entries(seenByKey) : new HashMap<>();
        List<com.mapsocial.dto.MessageSeenByDTO> seenByDTOs = seenByMap.entrySet().stream()
                .map(entry -> {
                    String uid = (String) entry.getKey();
                    LocalDateTime seenAt = LocalDateTime.parse((String) entry.getValue());
                    User u = userRepository.findById(UUID.fromString(uid)).orElse(null);
                    String uName = u != null ? (u.getDisplayName() != null ? u.getDisplayName() : u.getEmail()) : UNKNOWN_USER;
                    String uAvatar = u != null ? u.getAvatarUrl() : null;
                    return com.mapsocial.dto.MessageSeenByDTO.builder()
                            .userId(uid)
                            .userName(uName)
                            .userAvatar(uAvatar)
                            .seenAt(seenAt)
                            .build();
                })
                .collect(Collectors.toList());

        return MessageDTO.builder()
                .id(message.getId())
                .conversationId(message.getConversationId())
                .senderId(message.getSenderId())
                .senderName(senderName)
                .senderAvatar(senderAvatar)
                .content(message.getContent())
                .type(message.getType())
                .replyToMessageId(message.getReplyToMessageId())
                .replyToMessage(replyToMessage)
                .attachmentUrls(message.getAttachmentUrls())
                .isEdited(message.isEdited())
                .updatedAt(message.getUpdatedAt())
                .createdAt(message.getCreatedAt())
                .status(status)
                .seenBy(seenByDTOs)
                .build();
    }
}

