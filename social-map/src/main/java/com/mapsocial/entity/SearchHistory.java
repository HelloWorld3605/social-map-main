package com.mapsocial.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(
    name = "search_history",
    indexes = {
        @Index(name = "idx_user_id", columnList = "user_id"),
        @Index(name = "idx_created_at", columnList = "created_at"),
        @Index(name = "idx_type", columnList = "type")
    }
)
public class SearchHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Quan hệ chuẩn
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @Column(nullable = false)
    private String query;

    @Column(nullable = false)
    private String type; // user, shop, location, post, generic

    // JSONB của PostgreSQL
    @Column(columnDefinition = "jsonb")
    private String data;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

}
