package com.mapsocial.repository;

import com.mapsocial.entity.UserShop;
import com.mapsocial.enums.ShopRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface UserShopRepository extends JpaRepository<UserShop, UUID> {

    boolean existsByUserIdAndShopId(UUID userId, UUID shopId);

    boolean existsByUserIdAndShopIdAndManagerRole(UUID userId, UUID shopId, ShopRole role);

    Optional<UserShop> findByUserIdAndShopId(UUID userId, UUID shopId);

    @Query("SELECT COUNT(us) FROM UserShop us WHERE us.user.id = :userId AND us.managerRole = 'OWNER'")
    Long countShopsByUserId(@Param("userId") UUID userId);
}
