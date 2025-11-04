package com.mapsocial.repository;

import com.mapsocial.entity.SellerRequest;
import com.mapsocial.enums.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SellerRequestRepository extends JpaRepository<SellerRequest, UUID> {

    List<SellerRequest> findByStatusOrderByCreatedAtDesc(RequestStatus status);

    List<SellerRequest> findAllByOrderByCreatedAtDesc();

    List<SellerRequest> findByUserIdOrderByCreatedAtDesc(UUID userId);

    Optional<SellerRequest> findByUserIdAndStatus(UUID userId, RequestStatus status);

    @Query("SELECT COUNT(sr) FROM SellerRequest sr WHERE sr.status = 'PENDING'")
    Long countPendingRequests();

    boolean existsByUserIdAndStatus(UUID userId, RequestStatus status);
}

