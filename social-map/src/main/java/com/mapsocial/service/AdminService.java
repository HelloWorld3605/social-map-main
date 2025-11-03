package com.mapsocial.service;

import com.mapsocial.dto.request.admin.UpdateUserRequest;
import com.mapsocial.dto.response.admin.DashboardStatsResponse;
import com.mapsocial.dto.response.admin.UserManagementResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface AdminService {
    DashboardStatsResponse getDashboardStats();

    Page<UserManagementResponse> getAllUsers(Pageable pageable, String search, Boolean includeDeleted);

    UserManagementResponse updateUser(UUID userId, UpdateUserRequest request);

    void softDeleteUser(UUID userId);

    void restoreUser(UUID userId);
}

