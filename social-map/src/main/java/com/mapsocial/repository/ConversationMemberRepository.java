package com.mapsocial.repository;

import com.mapsocial.entity.Chat.ConversationMember;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationMemberRepository extends MongoRepository<ConversationMember, String> {

    // Tìm tất cả members trong một conversation
    List<ConversationMember> findByConversationId(String conversationId);

    // Tìm tất cả conversations của một user (chỉ active)
    @Query("{'userId': ?0, 'active': true, 'deleted': false}")
    List<ConversationMember> findActiveConversationsByUserId(String userId);

    // Tìm tất cả conversations của một user (bao gồm cả deleted để restore)
    List<ConversationMember> findByUserId(String userId);

    // Tìm member cụ thể trong conversation
    @Query("{'conversationId': ?0, 'userId': ?1}")
    Optional<ConversationMember> findByConversationIdAndUserId(String conversationId, String userId);

    // Kiểm tra user có trong conversation không
    @Query(value = "{'conversationId': ?0, 'userId': ?1, 'active': true}", exists = true)
    boolean existsByConversationIdAndUserIdAndActive(String conversationId, String userId);

    // Đếm số members trong conversation
    @Query(value = "{'conversationId': ?0, 'active': true}", count = true)
    long countActiveByConversationId(String conversationId);

    // Tìm conversation 1-1 giữa 2 users
    @Query("{'userId': {$in: [?0, ?1]}, 'active': true}")
    List<ConversationMember> findByUserIdsIn(String userId1, String userId2);

    // Tìm members đang typing
    @Query("{'conversationId': ?0, 'typing': true}")
    List<ConversationMember> findTypingMembers(String conversationId);

    // Xóa tất cả members của conversation (khi xóa group)
    void deleteByConversationId(String conversationId);
}
