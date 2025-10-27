package com.mapsocial.repository;

import com.mapsocial.entity.UserShop;
import com.mapsocial.enums.ShopRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserShopRepository extends JpaRepository<UserShop, UUID> {

    boolean existsByUserIdAndShopId(UUID userId, UUID shopId);

    boolean existsByUserIdAndShopIdAndManagerRole(UUID userId, UUID shopId, ShopRole role);

    Optional<UserShop> findByUserIdAndShopId(UUID userId, UUID shopId);

}
