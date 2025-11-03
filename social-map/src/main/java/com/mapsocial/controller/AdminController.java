package com.mapsocial.controller;

import com.mapsocial.dto.request.admin.UpdateUserRequest;
import com.mapsocial.dto.response.admin.DashboardStatsResponse;
import com.mapsocial.dto.response.admin.SellerRequestResponse;
import com.mapsocial.dto.response.admin.UserManagementResponse;
import com.mapsocial.enums.RequestStatus;
import com.mapsocial.service.AdminService;
import com.mapsocial.service.SellerRequestService;
import com.mapsocial.service.impl.CustomUserDetailsService.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "API quản trị hệ thống")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final SellerRequestService sellerRequestService;

    @GetMapping("/dashboard/stats")
    @Operation(summary = "Lấy thống kê dashboard", description = "Lấy các số liệu thống kê tổng quan cho admin dashboard")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lấy thống kê thành công"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    public ResponseEntity<DashboardStatsResponse> getDashboardStats(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        DashboardStatsResponse stats = adminService.getDashboardStats();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/seller-requests")
    @Operation(summary = "Lấy danh sách yêu cầu trở thành seller", description = "Lấy tất cả yêu cầu trở thành seller")
    public ResponseEntity<List<SellerRequestResponse>> getAllSellerRequests(
            @RequestParam(required = false) RequestStatus status) {
        List<SellerRequestResponse> requests = sellerRequestService.getAllRequests(status);
        return ResponseEntity.ok(requests);
    }

    @PutMapping("/seller-requests/{requestId}/approve")
    @Operation(summary = "Chấp nhận yêu cầu trở thành seller", description = "Admin chấp nhận yêu cầu và nâng cấp user lên SELLER")
    public ResponseEntity<SellerRequestResponse> approveSellerRequest(
            @PathVariable UUID requestId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        SellerRequestResponse response = sellerRequestService.approveRequest(
                requestId,
                userPrincipal.getUser().getId()
        );
        return ResponseEntity.ok(response);
    }

    @PutMapping("/seller-requests/{requestId}/reject")
    @Operation(summary = "Từ chối yêu cầu trở thành seller", description = "Admin từ chối yêu cầu với lý do")
    public ResponseEntity<SellerRequestResponse> rejectSellerRequest(
            @PathVariable UUID requestId,
            @RequestParam String reason,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        SellerRequestResponse response = sellerRequestService.rejectRequest(
                requestId,
                reason,
                userPrincipal.getUser().getId()
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/users")
    @Operation(summary = "Lấy danh sách users với phân trang", description = "Admin lấy danh sách tất cả users")
    public ResponseEntity<Page<UserManagementResponse>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean includeDeleted) {

        Sort sort = sortDirection.equalsIgnoreCase("ASC")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<UserManagementResponse> users = adminService.getAllUsers(pageable, search, includeDeleted);
        return ResponseEntity.ok(users);
    }

    @PutMapping("/users/{userId}")
    @Operation(summary = "Cập nhật thông tin user", description = "Admin cập nhật thông tin user")
    public ResponseEntity<UserManagementResponse> updateUser(
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateUserRequest request) {
        UserManagementResponse response = adminService.updateUser(userId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/users/{userId}")
    @Operation(summary = "Xóa mềm user", description = "Admin xóa mềm user")
    public ResponseEntity<String> softDeleteUser(@PathVariable UUID userId) {
        adminService.softDeleteUser(userId);
        return ResponseEntity.ok("User đã được xóa thành công");
    }

    @PutMapping("/users/{userId}/restore")
    @Operation(summary = "Khôi phục user đã xóa", description = "Admin khôi phục user đã bị xóa mềm")
    public ResponseEntity<String> restoreUser(@PathVariable UUID userId) {
        adminService.restoreUser(userId);
        return ResponseEntity.ok("User đã được khôi phục thành công");
    }
}

