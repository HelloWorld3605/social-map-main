package com.mapsocial.repository;

import com.mapsocial.entity.Shop;
import com.mapsocial.enums.ShopRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ShopRepository extends JpaRepository<Shop, UUID> {
}
