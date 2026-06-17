package com.mapsocial.entity;

import com.mapsocial.config.JsonbType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Type;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(
    name = "notes",
    indexes = {
        @Index(name = "idx_notes_user_id", columnList = "user_id"),
        @Index(name = "idx_notes_created_at", columnList = "created_at")
    }
)
public class Note {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String title;

    /**
     * Lưu toàn bộ danh sách tabs (mỗi tab có blocks: text/location) dưới dạng JSONB.
     * Cấu trúc: [{ id, title, blocks: [{ id, type, content?, marker? }] }]
     */
    @Type(JsonbType.class)
    @Column(columnDefinition = "jsonb", nullable = false)
    @Builder.Default
    private String tabs = "[]";

    @Column(name = "active_tab_id")
    private String activeTabId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
