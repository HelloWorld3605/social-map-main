package com.mapsocial.repository;

import com.mapsocial.entity.Shop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.UUID;

public interface ShopRepository extends JpaRepository<Shop, UUID> {

    // Admin dashboard statistics
    @Query("SELECT COUNT(s) FROM Shop s WHERE s.status = 'OPEN'")
    Long countActiveShops();

    @Query("SELECT COUNT(s) FROM Shop s WHERE s.status = 'CLOSED' OR s.status = 'SUSPENDED'")
    Long countInactiveShops();

    @Query("SELECT COUNT(s) FROM Shop s WHERE s.createdAt >= :startDate")
    Long countNewShopsSince(@Param("startDate") LocalDateTime startDate);
}
