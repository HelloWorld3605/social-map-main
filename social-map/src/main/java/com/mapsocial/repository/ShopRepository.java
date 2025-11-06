package com.mapsocial.repository;

import com.mapsocial.entity.Shop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface ShopRepository extends JpaRepository<Shop, UUID> {

    // Admin dashboard statistics
    @Query("SELECT COUNT(s) FROM Shop s WHERE s.status = 'OPEN'")
    Long countActiveShops();

    @Query("SELECT COUNT(s) FROM Shop s WHERE s.status = 'CLOSED' OR s.status = 'SUSPENDED'")
    Long countInactiveShops();

    @Query("SELECT COUNT(s) FROM Shop s WHERE s.createdAt >= :startDate")
    Long countNewShopsSince(@Param("startDate") LocalDateTime startDate);

    // ==================== BOUNDING BOX QUERIES (PostGIS) ====================

    /**
     * Lấy tất cả shops trong vùng bounding box sử dụng PostGIS
     * Sử dụng ST_MakeEnvelope cho hiệu suất tốt nhất
     */
    @Query(value = "SELECT * FROM shops WHERE " +
           "location && ST_MakeEnvelope(:west, :south, :east, :north, 4326) AND " +
           "status = 'OPEN'",
           nativeQuery = true)
    List<Shop> findShopsInBoundingBox(
            @Param("north") Double north,
            @Param("south") Double south,
            @Param("east") Double east,
            @Param("west") Double west
    );

    /**
     * Lấy shops trong vùng bounding box với giới hạn số lượng (PostGIS)
     */
    @Query(value = "SELECT * FROM shops WHERE " +
           "location && ST_MakeEnvelope(:west, :south, :east, :north, 4326) AND " +
           "status = 'OPEN' " +
           "LIMIT :limit",
           nativeQuery = true)
    List<Shop> findShopsInBoundingBoxWithLimit(
            @Param("north") Double north,
            @Param("south") Double south,
            @Param("east") Double east,
            @Param("west") Double west,
            @Param("limit") Integer limit
    );

    /**
     * Đếm số lượng shops trong vùng bounding box (PostGIS)
     */
    @Query(value = "SELECT COUNT(*) FROM shops WHERE " +
           "location && ST_MakeEnvelope(:west, :south, :east, :north, 4326) AND " +
           "status = 'OPEN'",
           nativeQuery = true)
    Long countShopsInBoundingBox(
            @Param("north") Double north,
            @Param("south") Double south,
            @Param("east") Double east,
            @Param("west") Double west
    );

    /**
     * Lấy chỉ tọa độ và ID của shops (lightweight query cho clustering)
     * Sử dụng PostGIS cho performance tốt nhất
     */
    @Query(value = "SELECT s.id, s.latitude, s.longitude, s.name FROM shops s WHERE " +
           "s.location && ST_MakeEnvelope(:west, :south, :east, :north, 4326) AND " +
           "s.status = 'OPEN'",
           nativeQuery = true)
    List<Object[]> findShopLocationsInBoundingBox(
            @Param("north") Double north,
            @Param("south") Double south,
            @Param("east") Double east,
            @Param("west") Double west
    );

    /**
     * Tìm shops trong bán kính (radius query) - Bonus feature với PostGIS
     * @param centerLat Vĩ độ trung tâm
     * @param centerLng Kinh độ trung tâm
     * @param radiusMeters Bán kính tính bằng mét
     * @param limit Giới hạn số lượng
     */
    @Query(value = "SELECT *, " +
           "ST_Distance(location, ST_SetSRID(ST_MakePoint(:centerLng, :centerLat), 4326)::geography) as distance " +
           "FROM shops WHERE " +
           "ST_DWithin(location, ST_SetSRID(ST_MakePoint(:centerLng, :centerLat), 4326)::geography, :radiusMeters) AND " +
           "status = 'OPEN' " +
           "ORDER BY distance " +
           "LIMIT :limit",
           nativeQuery = true)
    List<Shop> findShopsWithinRadius(
            @Param("centerLat") Double centerLat,
            @Param("centerLng") Double centerLng,
            @Param("radiusMeters") Double radiusMeters,
            @Param("limit") Integer limit
    );
}
