package com.mapsocial.repository;

import com.mapsocial.entity.SearchHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SearchHistoryRepository extends JpaRepository<SearchHistory, Long> {

    @Query("SELECT sh FROM SearchHistory sh WHERE sh.user.id = :userId ORDER BY sh.createdAt DESC")
    List<SearchHistory> findByUserIdOrderByCreatedAtDesc(@Param("userId") UUID userId);

    @Query("SELECT sh FROM SearchHistory sh WHERE sh.user.id = :userId ORDER BY sh.createdAt DESC LIMIT 5")
    List<SearchHistory> findTop5ByUserIdOrderByCreatedAtDesc(@Param("userId") UUID userId);

    @Modifying
    @Query("DELETE FROM SearchHistory sh WHERE sh.user.id = :userId AND sh.id NOT IN (SELECT sh2.id FROM SearchHistory sh2 WHERE sh2.user.id = :userId ORDER BY sh2.createdAt DESC LIMIT :limit)")
    void deleteOldSearchHistory(@Param("userId") UUID userId, @Param("limit") int limit);

    @Query("SELECT sh FROM SearchHistory sh WHERE sh.user.id = :userId AND sh.query = :query AND sh.type = :type AND COALESCE(sh.data, 'NULL') = COALESCE(:data, 'NULL') ORDER BY sh.createdAt DESC")
    List<SearchHistory> findByUserIdAndQueryAndTypeAndData(@Param("userId") UUID userId, @Param("query") String query, @Param("type") String type, @Param("data") String data);

    @Modifying
    @Query("DELETE FROM SearchHistory sh WHERE sh.user.id = :userId")
    void deleteAllByUserId(@Param("userId") UUID userId);
}
