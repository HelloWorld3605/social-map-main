package com.mapsocial.repository;

import com.mapsocial.entity.Chat.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface MessageRepository extends MongoRepository<Message, String> {

    List<Message> findByConversationIdOrderByCreatedAtDesc(String conversationId, Pageable pageable);

    List<Message> findByConversationIdOrderByCreatedAtAsc(String conversationId);
    Page<Message> findByConversationIdAndDeletedFalseOrderByCreatedAtDesc(String conversationId, Pageable pageable);

    @Query("{'conversationId': ?0, 'createdAt': {$gt: ?1}, 'deleted': false}")
    List<Message> findRecentMessages(String conversationId, LocalDateTime since);

    Page<Message> findByConversationIdAndDeletedFalseOrderByCreatedAtAsc(String conversationId, Pageable pageable);
    long countByConversationIdAndCreatedAtAfter(String conversationId, LocalDateTime after);
    List<Message> findByConversationIdAndDeletedFalseOrderByCreatedAtAsc(String conversationId);

    // Tìm message để reply
    @Query("{'_id': ?0, 'deleted': false}")
    Optional<Message> findByIdAndDeletedFalse(String messageId);

    // Tìm các messages đã reply một message cụ thể
    List<Message> findByReplyToMessageIdAndDeletedFalse(String replyToMessageId);

    //Search messages trong conversation
    @Query("{'conversationId': ?0, 'content': {$regex: ?1, $options: 'i'}, 'deleted': false}")
    List<Message> searchInConversation(String conversationId, String searchText);

    // Tìm messages mới sau một thời điểm (cho real-time sync)
    @Query("{'conversationId': ?0, 'createdAt': {$gt: ?1}, 'deleted': false}")
    List<Message> findNewMessages(String conversationId, LocalDateTime lastReadAt);

    //  Đếm số unread messages
    @Query(value = "{ 'conversationId': ?0, 'senderId': { $ne: ?2 }, 'createdAt': { $gt: ?1 }, 'deleted': false }", count = true)
    long countUnreadMessages(String conversationId, LocalDateTime lastReadAt, String currentUserId);

    //  Tìm message cuối cùng của conversation
    Optional<Message> findTop1ByConversationIdAndDeletedFalseOrderByCreatedAtDesc(String conversationId);
}