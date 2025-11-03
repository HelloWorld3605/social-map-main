package com.mapsocial.service;

import com.mapsocial.dto.request.SellerRegistrationRequest;
import com.mapsocial.dto.response.admin.SellerRequestResponse;
import com.mapsocial.enums.RequestStatus;

import java.util.List;
import java.util.UUID;

public interface SellerRequestService {
    SellerRequestResponse createRequest(UUID userId, SellerRegistrationRequest request);
    List<SellerRequestResponse> getAllRequests(RequestStatus status);
    SellerRequestResponse approveRequest(UUID requestId, UUID adminId);
    SellerRequestResponse rejectRequest(UUID requestId, String reason, UUID adminId);
    SellerRequestResponse getRequestById(UUID requestId);
}

