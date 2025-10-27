package com.mapsocial.repository;

import com.mapsocial.entity.Chat.Conversation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ConversationRepository extends MongoRepository<Conversation, String> {

    // ❌ XOÁ: Các query dùng memberIds
    // ✅ Tìm conversation qua ConversationMemberRepository

    // Tìm conversation theo ID và kiểm tra tồn tại
    Optional<Conversation> findById(String id);

    // Sắp xếp conversations theo lastMessageAt
    @Query(value = "{}", sort = "{'lastMessageAt': -1}")
    Page<Conversation> findAllOrderByLastMessageAtDesc(Pageable pageable);
}
