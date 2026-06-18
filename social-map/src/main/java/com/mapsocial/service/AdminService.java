package com.mapsocial.service;

import com.mapsocial.dto.request.admin.UpdateUserRequest;
import com.mapsocial.dto.response.admin.DashboardStatsResponse;
import com.mapsocial.dto.response.admin.UserManagementResponse;
import com.mapsocial.dto.response.shop.ShopResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface AdminService {
    DashboardStatsResponse getDashboardStats();

    Page<UserManagementResponse> getAllUsers(Pageable pageable, String search, Boolean includeDeleted);

    UserManagementResponse updateUser(UUID userId, UpdateUserRequest request);

    void softDeleteUser(UUID userId);

    void restoreUser(UUID userId);

    // Shop management
    Page<ShopResponse> getAllShopsAdmin(Pageable pageable, String search, Boolean includeDeleted);

    void softDeleteShop(UUID shopId);

    void restoreShop(UUID shopId);

    void softDeleteMultipleShops(List<UUID> shopIds);

    void updateShopStatus(UUID shopId, com.mapsocial.enums.ShopStatus status);
}

