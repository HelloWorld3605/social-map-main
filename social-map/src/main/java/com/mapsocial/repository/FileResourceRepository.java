package com.mapsocial.repository;


import com.mapsocial.entity.FileResource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface FileResourceRepository extends JpaRepository<FileResource, UUID> {
    Optional<FileResource> findByHash(String hash);
}
