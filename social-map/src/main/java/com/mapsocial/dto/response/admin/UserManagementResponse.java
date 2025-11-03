package com.mapsocial.dto.response.admin;

import com.mapsocial.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserManagementResponse {
    private UUID id;
    private String email;
    private String displayName;
    private String avatarUrl;
    private UserRole role;
    private boolean emailVerified;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
    private Long friendsCount;
    private Long shopsCount;
}

