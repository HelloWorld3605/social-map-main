package com.mapsocial.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "file_resource")
public class FileResource {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String hash;   // Hash SHA-256 của file

    @Column(nullable = false)
    private String url;    // Link Cloudinary
}
