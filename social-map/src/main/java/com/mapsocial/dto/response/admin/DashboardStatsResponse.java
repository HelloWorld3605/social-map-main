package com.mapsocial.dto.response.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

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

    // New additions
    private List<UserGrowthDetail> userGrowth;
    private List<RecentActivity> recentActivities;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class UserGrowthDetail {
        private String month;
        private Long value;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class RecentActivity {
        private String name;
        private String action;
        private LocalDateTime createdAt;
        private String color;
    }
}

