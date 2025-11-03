package com.mapsocial.service.impl;

import com.mapsocial.dto.request.admin.UpdateUserRequest;
import com.mapsocial.dto.response.admin.DashboardStatsResponse;
import com.mapsocial.dto.response.admin.UserManagementResponse;
import com.mapsocial.entity.User;
import com.mapsocial.repository.FriendshipRepository;
import com.mapsocial.repository.SellerRequestRepository;
import com.mapsocial.repository.ShopRepository;
import com.mapsocial.repository.TagRepository;
import com.mapsocial.repository.UserRepository;
import com.mapsocial.repository.UserShopRepository;
import com.mapsocial.service.AdminService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final ShopRepository shopRepository;
    private final TagRepository tagRepository;
    private final SellerRequestRepository sellerRequestRepository;
    private final FriendshipRepository friendshipRepository;
    private final UserShopRepository userShopRepository;

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

        // Lấy tổng số shops
        Long totalShops = shopRepository.count();

        // Lấy số shops active/inactive
        Long totalActiveShops = shopRepository.countActiveShops();
        Long totalInactiveShops = shopRepository.countInactiveShops();

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

        user.setDeletedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void restoreUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        user.setDeletedAt(null);
        userRepository.save(user);
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

