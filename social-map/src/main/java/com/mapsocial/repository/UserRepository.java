package com.mapsocial.repository;

import com.mapsocial.entity.User;
import com.mapsocial.dto.UserStatusDTO;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    boolean existsByEmail(String email);

    Optional<User> findByEmail(String email);

    Optional<User> findByEmailVerificationToken(String token);

    void deleteByEmailVerificationExpiresAtBefore(LocalDateTime dateTime);

    // Soft delete methods cho User
    @Query("SELECT u FROM User u WHERE u.deletedAt IS NULL")
    List<User> findAllActive();

    @Query("SELECT u FROM User u WHERE u.deletedAt IS NULL")
    org.springframework.data.domain.Page<User> findAllActive(org.springframework.data.domain.Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.deletedAt IS NULL AND " +
           "(LOWER(u.displayName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    org.springframework.data.domain.Page<User> searchActiveUsers(@Param("search") String search,
                                                                   org.springframework.data.domain.Pageable pageable);

    @Query("SELECT u FROM User u WHERE " +
           "LOWER(u.displayName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))")
    org.springframework.data.domain.Page<User> searchUsersIncludingDeleted(@Param("search") String search,
                                                                             org.springframework.data.domain.Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.id = :id AND u.deletedAt IS NULL")
    Optional<User> findActiveById(@Param("id") String id);

    @Query("SELECT u FROM User u WHERE u.email = :email AND u.deletedAt IS NULL")
    Optional<User> findActiveByEmail(@Param("email") String email);

    @Query("SELECT u FROM User u WHERE u.id = :id")
    Optional<User> findByIdIncludingDeleted(@Param("id") String id);

    @Query("SELECT COUNT(u) > 0 FROM User u WHERE u.email = :email AND u.deletedAt IS NULL")
    boolean existsByEmailAndNotDeleted(@Param("email") String email);

    // Search users để chat
    @Query("SELECT u FROM User u WHERE u.deletedAt IS NULL AND " +
           "(LOWER(u.displayName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%')))" )
    List<User> findByDisplayNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
            @Param("query") String displayName,
            @Param("query") String email,
            Pageable pageable);

    // Admin dashboard statistics
    @Query("SELECT COUNT(u) FROM User u WHERE u.deletedAt IS NULL AND u.role = 'USER'")
    Long countBuyers();  // Đếm USER (người dùng thường)

    @Query("SELECT COUNT(u) FROM User u WHERE u.deletedAt IS NULL AND u.role = 'SELLER'")
    Long countSellers();

    @Query("SELECT COUNT(u) FROM User u WHERE u.deletedAt IS NULL AND (u.role = 'ADMIN' OR u.role = 'SUPER_ADMIN')")
    Long countAdmins();

    @Query("SELECT COUNT(u) FROM User u WHERE u.deletedAt IS NULL AND u.createdAt >= :startDate")
    Long countNewUsersSince(@Param("startDate") LocalDateTime startDate);

    // Check citizenId exists
    boolean existsByCitizenId(String citizenId);

    // Update online status
    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.isOnline = :isOnline, u.lastActiveAt = :lastActiveAt WHERE u.id = :userId")
    void updateOnlineStatus(@Param("userId") UUID userId, @Param("isOnline") boolean isOnline, @Param("lastActiveAt") LocalDateTime lastActiveAt);

    // Find status by id
    @Query("SELECT new com.mapsocial.dto.UserStatusDTO(u.isOnline, u.lastActiveAt) FROM User u WHERE u.id = :userId")
    Optional<UserStatusDTO> findStatusById(@Param("userId") UUID userId);
}
