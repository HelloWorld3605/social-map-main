package com.mapsocial.dto.response.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DashboardStatsResponse {
    private Long totalUsers;
    private Long totalShops;
    private Long totalActiveShops;
    private Long totalInactiveShops;
    private Long newUsersThisMonth;
    private Long newShopsThisMonth;
    private Long totalTags;

    // Statistics by role
    private Long userCount;      // USER role (người dùng thường)
    private Long sellerCount;    // SELLER role
    private Long adminCount;     // ADMIN + SUPER_ADMIN

    // Seller requests
    private Long pendingSellerRequests;
}

