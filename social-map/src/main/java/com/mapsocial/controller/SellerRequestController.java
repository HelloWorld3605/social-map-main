package com.mapsocial.controller;

import com.mapsocial.dto.request.SellerRegistrationRequest;
import com.mapsocial.dto.response.admin.SellerRequestResponse;
import com.mapsocial.service.SellerRequestService;
import com.mapsocial.service.impl.CustomUserDetailsService.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/seller-requests")
@RequiredArgsConstructor
@Tag(name = "Seller Requests", description = "API quản lý yêu cầu trở thành seller")
public class SellerRequestController {

    private final SellerRequestService sellerRequestService;

    @PostMapping
    @Operation(summary = "Tạo yêu cầu trở thành seller", description = "User tạo yêu cầu để trở thành người bán hàng")
    public ResponseEntity<SellerRequestResponse> createSellerRequest(
            @Valid @RequestBody SellerRegistrationRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        SellerRequestResponse response = sellerRequestService.createRequest(
                userPrincipal.getUser().getId(),
                request
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my-requests")
    @Operation(summary = "Lấy các yêu cầu của tôi", description = "Lấy danh sách seller requests của user hiện tại")
    public ResponseEntity<List<SellerRequestResponse>> getMySellerRequests(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        // TODO: Implement get user's requests
        return ResponseEntity.ok(List.of());
    }
}

