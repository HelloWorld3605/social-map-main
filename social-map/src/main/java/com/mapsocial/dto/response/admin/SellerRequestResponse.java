package com.mapsocial.dto.response.admin;

import com.mapsocial.enums.RequestStatus;
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
public class SellerRequestResponse {
    private UUID id;
    private UUID userId;
    private String userEmail;
    private String userDisplayName;
    private String citizenId; // CCCD
    private RequestStatus status;
    private String rejectReason;
    private String reviewedByName;
    private LocalDateTime reviewedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
