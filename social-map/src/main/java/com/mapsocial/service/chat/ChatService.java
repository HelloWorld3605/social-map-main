package com.mapsocial.service.chat;

import com.mapsocial.dto.request.CreateConversationRequest;
import com.mapsocial.dto.request.SendMessageRequest;
import com.mapsocial.dto.response.ConversationDTO;
import com.mapsocial.dto.response.MessageDTO;
import com.mapsocial.entity.Chat.Conversation;
import com.mapsocial.entity.Chat.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ChatService {
    // Message management với features mới
    MessageDTO sendMessage(String senderId, SendMessageRequest request);
    MessageDTO editMessage(String messageId, String userId, String newContent);
    void deleteMessage(String messageId, String userId);

    // Conversation management
    ConversationDTO createConversation(CreateConversationRequest request, String createdBy);
    ConversationDTO getOrCreatePrivateConversation(String userId1, String userId2);
    List<ConversationDTO> getUserConversations(String userId);
    ConversationDTO getConversationById(String conversationId, String userId);

    // Group chat management
    ConversationDTO addMemberToConversation(String conversationId, String userId, String requesterId);
    void removeMemberFromConversation(String conversationId, String userId, String requesterId);
    void leaveConversation(String conversationId, String userId);
    ConversationDTO updateGroupInfo(String conversationId, String requesterId, String groupName, String groupAvatar);

    // Message pagination
    Page<MessageDTO> getMessages(String conversationId, String userId, Pageable pageable);
    List<MessageDTO> getNewMessages(String conversationId, String userId);

    //Read status
    void markMessagesAsRead(String conversationId, String userId);
    int getUnreadCount(String conversationId, String userId);

    // Typing indicator
    void setTypingStatus(String conversationId, String userId, boolean isTyping);
    List<String> getTypingUsers(String conversationId);

    //  Search
    List<MessageDTO> searchMessages(String conversationId, String searchText, String userId);
    List<ConversationDTO> searchUsers(String userId, String searchText);

    //  Validation
    boolean isMemberOfConversation(String conversationId, String userId);
}
