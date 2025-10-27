package com.mapsocial.repository;


import com.mapsocial.entity.PendingRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PendingRegistrationRepository extends JpaRepository<PendingRegistration, UUID> {

    Optional<PendingRegistration> findByEmail(String email);

    Optional<PendingRegistration> findByVerificationToken(String verificationToken);

    boolean existsByEmail(String email);

    void deleteByEmail(String email);

    void deleteByExpiresAtBefore(LocalDateTime dateTime);
}

