package com.mapsocial.repository;

import com.mapsocial.entity.Shop;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ShopRepository extends JpaRepository<Shop, UUID> {

    // Override findById to exclude soft-deleted shops
    @Query("SELECT s FROM Shop s WHERE s.id = :id AND s.deletedAt IS NULL")
    Optional<Shop> findActiveById(@Param("id") UUID id);

    // Override findAll to exclude soft-deleted shops
    @Query("SELECT s FROM Shop s WHERE s.deletedAt IS NULL")
    List<Shop> findAllActive();

    // Admin: Get all shops including deleted with pagination
    @Query("SELECT s FROM Shop s")
    Page<Shop> findAllShopsAdmin(Pageable pageable);

    // Admin: Get only active shops with pagination
    @Query("SELECT s FROM Shop s WHERE s.deletedAt IS NULL")
    Page<Shop> findAllActiveShops(Pageable pageable);

    // Admin: Search shops including deleted
    @Query("SELECT s FROM Shop s WHERE LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(s.address) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Shop> searchShopsIncludingDeleted(@Param("search") String search, Pageable pageable);

    // Admin: Search only active shops
    @Query("SELECT s FROM Shop s WHERE s.deletedAt IS NULL AND (LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(s.address) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Shop> searchActiveShops(@Param("search") String search, Pageable pageable);

    /**
     * Soft delete shops by list of IDs
     */
    @Query("UPDATE Shop s SET s.deletedAt = :deletedAt WHERE s.id IN :shopIds")
    @org.springframework.data.jpa.repository.Modifying
    void softDeleteByIds(@Param("shopIds") List<UUID> shopIds, @Param("deletedAt") LocalDateTime deletedAt);

    /**
     * Restore soft-deleted shops by list of IDs
     */
    @Query("UPDATE Shop s SET s.deletedAt = NULL WHERE s.id IN :shopIds")
    @org.springframework.data.jpa.repository.Modifying
    void restoreByIds(@Param("shopIds") List<UUID> shopIds);

    // Admin dashboard statistics
    @Query("SELECT COUNT(s) FROM Shop s WHERE s.status = 'OPEN' AND s.deletedAt IS NULL")
    Long countActiveShops();

    @Query("SELECT COUNT(s) FROM Shop s WHERE (s.status = 'CLOSED' OR s.status = 'SUSPENDED') AND s.deletedAt IS NULL")
    Long countInactiveShops();

    @Query("SELECT COUNT(s) FROM Shop s WHERE s.createdAt >= :startDate AND s.deletedAt IS NULL")
    Long countNewShopsSince(@Param("startDate") LocalDateTime startDate);

    // ==================== BOUNDING BOX QUERIES (PostGIS) ====================

    /**
     * Lấy tất cả shops trong vùng bounding box sử dụng PostGIS
     * Sử dụng ST_MakeEnvelope cho hiệu suất tốt nhất
     */
    @Query(value = "SELECT * FROM shops WHERE " +
            "location && ST_MakeEnvelope(:west, :south, :east, :north, 4326) AND " +
            "status = 'OPEN' AND deleted_at IS NULL",
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
            "status = 'OPEN' AND deleted_at IS NULL " +
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
            "status = 'OPEN' AND deleted_at IS NULL",
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
            "s.status = 'OPEN' AND s.deleted_at IS NULL",
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
            "status = 'OPEN' AND deleted_at IS NULL " +
            "ORDER BY distance " +
            "LIMIT :limit",
            nativeQuery = true)
    List<Shop> findShopsWithinRadius(
            @Param("centerLat") Double centerLat,
            @Param("centerLng") Double centerLng,
            @Param("radiusMeters") Double radiusMeters,
            @Param("limit") Integer limit
    );

    /**
     * Tìm kiếm shops với Full-Text Search và khoảng cách (Best Practice)
     * Hỗ trợ prefix matching và fuzzy search giống Google Maps
     */
    @Query(value = "SELECT *, " +
            "CASE " +
            "    WHEN LOWER(name) LIKE LOWER(CONCAT(:query, '%')) THEN 100 " +
            "    WHEN LOWER(name) LIKE LOWER(CONCAT('%', :query, '%')) THEN 80 " +
            "    WHEN LOWER(address) LIKE LOWER(CONCAT('%', :query, '%')) THEN 60 " +
            "    WHEN LOWER(description) LIKE LOWER(CONCAT('%', :query, '%')) THEN 40 " +
            "    ELSE ts_rank(" +
            "        (" +
            "            setweight(to_tsvector('simple', coalesce(name,'')), 'A') || " +
            "            setweight(to_tsvector('simple', coalesce(address,'')), 'B') || " +
            "            setweight(to_tsvector('simple', coalesce(description,'')), 'C') " +
            "        ), " +
            "        plainto_tsquery('simple', :query)" +
            "    ) * 20 " +
            "END AS score, " +
            "ST_Distance(" +
            "    geography(ST_MakePoint(longitude, latitude)), " +
            "    geography(ST_MakePoint(:lng, :lat))" +
            ") AS distance " +
            "FROM shops " +
            "WHERE status = 'OPEN' AND deleted_at IS NULL AND (" +
            "    LOWER(name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "    LOWER(address) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "    LOWER(description) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "    LOWER(phone_number) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "    (" +
            "        setweight(to_tsvector('simple', coalesce(name,'')), 'A') || " +
            "        setweight(to_tsvector('simple', coalesce(address,'')), 'B') || " +
            "        setweight(to_tsvector('simple', coalesce(description,'')), 'C') " +
            "    ) @@ plainto_tsquery('simple', :query) " +
            ") " +
            "ORDER BY score DESC, distance ASC " +
            "LIMIT 20", nativeQuery = true)
    List<Shop> searchShopsFTS(@Param("query") String query, @Param("lng") double lng, @Param("lat") double lat);

    /**
     * Tìm kiếm shops với unaccent (hỗ trợ tiếng Việt không dấu)
     * VD: "ca phe" sẽ tìm được "Cà phê", "Cafe"
     * Yêu cầu: CREATE EXTENSION unaccent; + CREATE FUNCTION immutable_unaccent;
     */
    @Query(value = "SELECT *, " +
            "CASE " +
            "    WHEN LOWER(immutable_unaccent(name)) LIKE LOWER(immutable_unaccent(CONCAT(:query, '%'))) THEN 100 " +
            "    WHEN LOWER(immutable_unaccent(name)) LIKE LOWER(immutable_unaccent(CONCAT('%', :query, '%'))) THEN 80 " +
            "    WHEN LOWER(immutable_unaccent(address)) LIKE LOWER(immutable_unaccent(CONCAT('%', :query, '%'))) THEN 60 " +
            "    WHEN LOWER(immutable_unaccent(description)) LIKE LOWER(immutable_unaccent(CONCAT('%', :query, '%'))) THEN 40 " +
            "    ELSE 20 " +
            "END AS score, " +
            "ST_Distance(" +
            "    geography(ST_MakePoint(longitude, latitude)), " +
            "    geography(ST_MakePoint(:lng, :lat))" +
            ") AS distance " +
            "FROM shops " +
            "WHERE status = 'OPEN' AND deleted_at IS NULL AND (" +
            "    LOWER(immutable_unaccent(name)) LIKE LOWER(immutable_unaccent(CONCAT('%', :query, '%'))) OR " +
            "    LOWER(immutable_unaccent(address)) LIKE LOWER(immutable_unaccent(CONCAT('%', :query, '%'))) OR " +
            "    LOWER(immutable_unaccent(description)) LIKE LOWER(immutable_unaccent(CONCAT('%', :query, '%'))) OR " +
            "    LOWER(phone_number) LIKE LOWER(CONCAT('%', :query, '%'))" +
            ") " +
            "ORDER BY score DESC, distance ASC " +
            "LIMIT 20", nativeQuery = true)
    List<Shop> searchShopsAdvanced(@Param("query") String query, @Param("lng") double lng, @Param("lat") double lat);
}
