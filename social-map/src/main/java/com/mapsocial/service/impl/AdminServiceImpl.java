package com.mapsocial.service.impl;

import com.mapsocial.dto.request.admin.UpdateUserRequest;
import com.mapsocial.dto.response.admin.DashboardStatsResponse;
import com.mapsocial.dto.response.admin.UserManagementResponse;
import com.mapsocial.entity.User;
import com.mapsocial.enums.ShopRole;
import com.mapsocial.repository.FriendshipRepository;
import com.mapsocial.repository.SellerRequestRepository;
import com.mapsocial.repository.ShopRepository;
import com.mapsocial.repository.TagRepository;
import com.mapsocial.repository.UserRepository;
import com.mapsocial.repository.UserShopRepository;
import com.mapsocial.service.AdminService;
import com.mapsocial.service.ShopStatusService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import com.mapsocial.entity.Shop;
import com.mapsocial.entity.SellerRequest;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final ShopRepository shopRepository;
    private final TagRepository tagRepository;
    private final SellerRequestRepository sellerRequestRepository;
    private final FriendshipRepository friendshipRepository;
    private final UserShopRepository userShopRepository;
    private final ShopStatusService shopStatusService;

    @Override
    @Transactional(readOnly = true)
    public DashboardStatsResponse getDashboardStats() {
        // Tính toán ngày bắt đầu tháng này
        LocalDateTime startOfMonth = LocalDateTime.now()
                .withDayOfMonth(1)
                .withHour(0)
                .withMinute(0)
                .withSecond(0)
                .withNano(0);

        // Lấy tổng số users
        Long totalUsers = userRepository.count();

        // Lấy số shops active/inactive
        Long totalActiveShops = shopRepository.countActiveShops();
        Long totalInactiveShops = shopRepository.countInactiveShops();

        // Lấy tổng số shops (chỉ bao gồm active và inactive, không bao gồm deleted)
        Long totalShops = totalActiveShops + totalInactiveShops;

        // Lấy users và shops mới trong tháng này
        Long newUsersThisMonth = userRepository.countNewUsersSince(startOfMonth);
        Long newShopsThisMonth = shopRepository.countNewShopsSince(startOfMonth);

        // Lấy tổng số tags
        Long totalTags = tagRepository.count();

        // Lấy số lượng users theo role
        Long userCount = userRepository.countBuyers();  // Đếm USER role
        Long sellerCount = userRepository.countSellers();
        Long adminCount = userRepository.countAdmins();

        // Lấy số lượng yêu cầu trở thành seller đang chờ
        Long pendingSellerRequests = sellerRequestRepository.countPendingRequests();

        // --- TÍNH TOÁN USER GROWTH STATS (6 THÁNG GẦN NHẤT) ---
        List<DashboardStatsResponse.UserGrowthDetail> userGrowthList = new ArrayList<>();
        // Khởi tạo trước danh sách 6 tháng gần nhất với giá trị mặc định là 0
        LocalDateTime current = LocalDateTime.now().minusMonths(5);
        for (int i = 0; i < 6; i++) {
            userGrowthList.add(DashboardStatsResponse.UserGrowthDetail.builder()
                    .month("T" + current.getMonthValue())
                    .value(0L)
                    .build());
            current = current.plusMonths(1);
        }

        LocalDateTime sinceDate = LocalDateTime.now().minusMonths(5)
                .withDayOfMonth(1)
                .withHour(0)
                .withMinute(0)
                .withSecond(0)
                .withNano(0);

        List<Object[]> rows = userRepository.getUserGrowthStatsNative(sinceDate);
        for (Object[] row : rows) {
            if (row[0] != null && row[2] != null) {
                int m = ((Number) row[0]).intValue();
                long val = ((Number) row[2]).longValue();
                String label = "T" + m;
                for (DashboardStatsResponse.UserGrowthDetail detail : userGrowthList) {
                    if (detail.getMonth().equals(label)) {
                        detail.setValue(val);
                        break;
                    }
                }
            }
        }

        // --- THU THẬP HOẠT ĐỘNG GẦN ĐÂY (MERGE TỪ NHIỀU NGUỒN) ---
        List<DashboardStatsResponse.RecentActivity> activities = new ArrayList<>();

        // 1. Users đăng ký tài khoản mới gần đây
        List<User> recentUsers = userRepository.findTop5ByDeletedAtIsNullOrderByCreatedAtDesc();
        for (User u : recentUsers) {
            if (u.getCreatedAt() != null) {
                activities.add(DashboardStatsResponse.RecentActivity.builder()
                        .name(u.getDisplayName() != null && !u.getDisplayName().trim().isEmpty() 
                                ? u.getDisplayName() 
                                : u.getEmail().split("@")[0])
                        .action("đã đăng ký tài khoản")
                        .createdAt(u.getCreatedAt())
                        .color("#C7CFA0")
                        .build());
            }
        }

        // 2. Cửa hàng được tạo mới gần đây
        List<Shop> recentShops = shopRepository.findTop5ByDeletedAtIsNullOrderByCreatedAtDesc();
        for (Shop s : recentShops) {
            if (s.getCreatedAt() != null) {
                String ownerName = s.getUserShops().stream()
                        .filter(us -> us.getManagerRole() == com.mapsocial.enums.ShopRole.OWNER)
                        .map(us -> us.getUser().getDisplayName())
                        .findFirst()
                        .orElse("Ẩn danh");
                activities.add(DashboardStatsResponse.RecentActivity.builder()
                        .name(ownerName)
                        .action("đã tạo cửa hàng mới \"" + s.getName() + "\"")
                        .createdAt(s.getCreatedAt())
                        .color("#BBD4E8")
                        .build());
            }
        }

        // 3. Yêu cầu làm seller mới gần đây
        List<SellerRequest> recentRequests = sellerRequestRepository.findTop5ByOrderByCreatedAtDesc();
        for (SellerRequest sr : recentRequests) {
            if (sr.getCreatedAt() != null) {
                String actionText = "đã gửi yêu cầu trở thành seller";
                if (sr.getStatus() == com.mapsocial.enums.RequestStatus.APPROVED) {
                    actionText = "đã được duyệt trở thành seller";
                } else if (sr.getStatus() == com.mapsocial.enums.RequestStatus.REJECTED) {
                    actionText = "bị từ chối yêu cầu trở thành seller";
                }
                activities.add(DashboardStatsResponse.RecentActivity.builder()
                        .name(sr.getUser().getDisplayName() != null && !sr.getUser().getDisplayName().trim().isEmpty() 
                                ? sr.getUser().getDisplayName() 
                                : sr.getUser().getEmail().split("@")[0])
                        .action(actionText)
                        .createdAt(sr.getCreatedAt())
                        .color("#F3C6D9")
                        .build());
            }
        }

        // Sắp xếp các hoạt động theo thời gian giảm dần
        activities.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));

        // Chỉ lấy 5 hoạt động mới nhất
        List<DashboardStatsResponse.RecentActivity> limitedActivities = activities.stream()
                .limit(5)
                .collect(Collectors.toList());

        return DashboardStatsResponse.builder()
                .totalUsers(totalUsers)
                .totalShops(totalShops)
                .totalActiveShops(totalActiveShops)
                .totalInactiveShops(totalInactiveShops)
                .newUsersThisMonth(newUsersThisMonth)
                .newShopsThisMonth(newShopsThisMonth)
                .totalTags(totalTags)
                .userCount(userCount)
                .sellerCount(sellerCount)
                .adminCount(adminCount)
                .pendingSellerRequests(pendingSellerRequests)
                .userGrowth(userGrowthList)
                .recentActivities(limitedActivities)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserManagementResponse> getAllUsers(Pageable pageable, String search, Boolean includeDeleted) {
        Page<User> usersPage;

        if (includeDeleted != null && includeDeleted) {
            // Include deleted users
            if (search != null && !search.trim().isEmpty()) {
                usersPage = userRepository.searchUsersIncludingDeleted(search, pageable);
            } else {
                usersPage = userRepository.findAll(pageable);
            }
        } else {
            // Only active users
            if (search != null && !search.trim().isEmpty()) {
                usersPage = userRepository.searchActiveUsers(search, pageable);
            } else {
                usersPage = userRepository.findAllActive(pageable);
            }
        }

        return usersPage.map(this::toUserManagementResponse);
    }

    @Override
    @Transactional
    public UserManagementResponse updateUser(UUID userId, UpdateUserRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmailAndNotDeleted(request.getEmail())) {
                throw new IllegalStateException("Email đã được sử dụng");
            }
            user.setEmail(request.getEmail());
        }

        if (request.getDisplayName() != null) {
            user.setDisplayName(request.getDisplayName());
        }

        if (request.getRole() != null) {
            user.setRole(request.getRole());
        }

        if (request.getEmailVerified() != null) {
            user.setIsEmailVerified(request.getEmailVerified());
        }

        User updatedUser = userRepository.save(user);
        return toUserManagementResponse(updatedUser);
    }

    @Override
    @Transactional
    public void softDeleteUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        if (user.getRole() == com.mapsocial.enums.UserRole.SUPER_ADMIN) {
            throw new IllegalStateException("Không thể xóa SUPER_ADMIN");
        }

        LocalDateTime now = LocalDateTime.now();
        user.setDeletedAt(now);
        userRepository.save(user);

        // Soft delete các shops mà user là OWNER
        List<UUID> shopIds = userShopRepository.findShopIdsByOwnerUserId(userId);
        if (!shopIds.isEmpty()) {
            shopRepository.softDeleteByIds(shopIds, now);
        }
    }

    @Override
    @Transactional
    public void restoreUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        user.setDeletedAt(null);
        userRepository.save(user);

        // Khôi phục các shops mà user là OWNER
        List<UUID> shopIds = userShopRepository.findShopIdsByOwnerUserId(userId);
        if (!shopIds.isEmpty()) {
            shopRepository.restoreByIds(shopIds);
        }
    }

    // ==================== SHOP MANAGEMENT ====================

    @Override
    @Transactional(readOnly = true)
    public Page<com.mapsocial.dto.response.shop.ShopResponse> getAllShopsAdmin(
            org.springframework.data.domain.Pageable pageable, String search, Boolean includeDeleted) {

        Page<com.mapsocial.entity.Shop> shopsPage;

        if (includeDeleted != null && includeDeleted) {
            // Include deleted shops
            if (search != null && !search.trim().isEmpty()) {
                shopsPage = shopRepository.searchShopsIncludingDeleted(search, pageable);
            } else {
                shopsPage = shopRepository.findAllShopsAdmin(pageable);
            }
        } else {
            // Only active shops
            if (search != null && !search.trim().isEmpty()) {
                shopsPage = shopRepository.searchActiveShops(search, pageable);
            } else {
                shopsPage = shopRepository.findAllActiveShops(pageable);
            }
        }

        return shopsPage.map(shop -> toShopResponse(shop, shopStatusService.getShopStatus(shop.getId())));
    }

    @Override
    @Transactional
    public void softDeleteShop(UUID shopId) {
        com.mapsocial.entity.Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new EntityNotFoundException("Shop not found"));

        shop.setDeletedAt(LocalDateTime.now());
        shopRepository.save(shop);
    }

    @Override
    @Transactional
    public void restoreShop(UUID shopId) {
        com.mapsocial.entity.Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new EntityNotFoundException("Shop not found"));

        shop.setDeletedAt(null);
        shopRepository.save(shop);
    }

    @Override
    @Transactional
    public void softDeleteMultipleShops(List<UUID> shopIds) {
        if (shopIds == null || shopIds.isEmpty()) {
            throw new IllegalArgumentException("Shop IDs list cannot be empty");
        }
        shopRepository.softDeleteByIds(shopIds, LocalDateTime.now());
    }

    private com.mapsocial.dto.response.shop.ShopResponse toShopResponse(com.mapsocial.entity.Shop shop, com.mapsocial.enums.ShopStatus computedStatus) {
        // Tìm owner của shop
        String ownerId = null;
        String ownerName = null;
        var ownerUserShopOpt = userShopRepository.findByShopIdAndManagerRole(shop.getId(), ShopRole.OWNER);
        if (ownerUserShopOpt.isPresent()) {
            var ownerUserShop = ownerUserShopOpt.get();
            ownerId = ownerUserShop.getUser().getId().toString();
            ownerName = ownerUserShop.getUser().getDisplayName();
        }

        return com.mapsocial.dto.response.shop.ShopResponse.builder()
                .id(shop.getId())
                .name(shop.getName())
                .address(shop.getAddress())
                .latitude(shop.getLatitude())
                .longitude(shop.getLongitude())
                .description(shop.getDescription())
                .phoneNumber(shop.getPhoneNumber())
                .openingTime(shop.getOpeningTime())
                .closingTime(shop.getClosingTime())
                .status(computedStatus != null ? computedStatus : shop.getStatus())
                .rating(shop.getRating())
                .reviewCount(shop.getReviewCount())
                .imageShopUrl(shop.getImageShopUrl())
                .deletedAt(shop.getDeletedAt())
                .tags(shop.getTags() != null
                        ? shop.getTags().stream()
                                .map(com.mapsocial.entity.Tag::getName)
                                .toList()
                        : new java.util.ArrayList<>())
                .ownerId(ownerId)
                .ownerName(ownerName)
                .build();
    }

    private UserManagementResponse toUserManagementResponse(User user) {
        Long friendsCount = friendshipRepository.countFriendsByUserId(user.getId());
        Long shopsCount = userShopRepository.countShopsByUserId(user.getId());

        return UserManagementResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole())
                .emailVerified(user.getIsEmailVerified())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .deletedAt(user.getDeletedAt())
                .friendsCount(friendsCount)
                .shopsCount(shopsCount)
                .build();
    }
}
