package com.mapsocial.repository;

import com.mapsocial.entity.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NoteRepository extends JpaRepository<Note, UUID> {

    @Query("SELECT n FROM Note n WHERE n.user.id = :userId AND n.deletedAt IS NULL ORDER BY n.updatedAt DESC")
    List<Note> findAllByUserIdAndNotDeleted(@Param("userId") UUID userId);

    @Query("SELECT n FROM Note n WHERE n.id = :noteId AND n.user.id = :userId AND n.deletedAt IS NULL")
    Optional<Note> findByIdAndUserId(@Param("noteId") UUID noteId, @Param("userId") UUID userId);
}
