package com.mapsocial.service.impl;

import com.mapsocial.dto.request.SellerRegistrationRequest;
import com.mapsocial.dto.response.admin.SellerRequestResponse;
import com.mapsocial.entity.SellerRequest;
import com.mapsocial.entity.User;
import com.mapsocial.enums.RequestStatus;
import com.mapsocial.enums.UserRole;
import com.mapsocial.repository.SellerRequestRepository;
import com.mapsocial.repository.UserRepository;
import com.mapsocial.service.SellerRequestService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SellerRequestServiceImpl implements SellerRequestService {

    private final SellerRequestRepository sellerRequestRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public SellerRequestResponse createRequest(UUID userId, SellerRegistrationRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        // Kiểm tra xem user đã là SELLER chưa
        if (user.getRole() == UserRole.SELLER) {
            throw new IllegalStateException("Bạn đã là người bán");
        }

        // Chỉ cho phép USER tạo request (không cho ADMIN, MODERATOR,...)
        if (user.getRole() != UserRole.USER) {
            throw new IllegalStateException("Chỉ tài khoản USER mới có thể đăng ký trở thành người bán");
        }

        // Kiểm tra xem đã có request PENDING chưa
        if (sellerRequestRepository.existsByUserIdAndStatus(userId, RequestStatus.PENDING)) {
            throw new IllegalStateException("Bạn đã có yêu cầu đang chờ xét duyệt");
        }

        // Kiểm tra CCCD
        if (request.getCitizenId() == null || request.getCitizenId().trim().isEmpty()) {
            throw new IllegalStateException("CCCD không được để trống");
        }

        // Kiểm tra CCCD đã được sử dụng chưa
        if (userRepository.existsByCitizenId(request.getCitizenId())) {
            throw new IllegalStateException("CCCD này đã được sử dụng bởi tài khoản khác");
        }

        // Lưu CCCD vào user nếu chưa có
        if (user.getCitizenId() == null || user.getCitizenId().trim().isEmpty()) {
            user.setCitizenId(request.getCitizenId());
            userRepository.save(user);
        }

        SellerRequest sellerRequest = SellerRequest.builder()
                .user(user)
                .citizenId(request.getCitizenId())
                .status(RequestStatus.PENDING)
                .build();

        SellerRequest savedRequest = sellerRequestRepository.save(sellerRequest);
        return toResponse(savedRequest);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SellerRequestResponse> getAllRequests(RequestStatus status) {
        List<SellerRequest> requests;
        if (status != null) {
            requests = sellerRequestRepository.findByStatusOrderByCreatedAtDesc(status);
        } else {
            requests = sellerRequestRepository.findAllByOrderByCreatedAtDesc();
        }
        return requests.stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public SellerRequestResponse approveRequest(UUID requestId, UUID adminId) {
        SellerRequest request = sellerRequestRepository.findById(requestId)
                .orElseThrow(() -> new EntityNotFoundException("Request not found"));

        if (request.getStatus() != RequestStatus.PENDING) {
            throw new IllegalStateException("Request đã được xử lý");
        }

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new EntityNotFoundException("Admin not found"));

        // Cập nhật status
        request.setStatus(RequestStatus.APPROVED);
        request.setReviewedBy(admin);
        request.setReviewedAt(LocalDateTime.now());

        // Nâng cấp user lên SELLER
        User user = request.getUser();
        user.setRole(UserRole.SELLER);
        userRepository.save(user);

        SellerRequest updatedRequest = sellerRequestRepository.save(request);
        return toResponse(updatedRequest);
    }

    @Override
    @Transactional
    public SellerRequestResponse rejectRequest(UUID requestId, String reason, UUID adminId) {
        SellerRequest request = sellerRequestRepository.findById(requestId)
                .orElseThrow(() -> new EntityNotFoundException("Request not found"));

        if (request.getStatus() != RequestStatus.PENDING) {
            throw new IllegalStateException("Request đã được xử lý");
        }

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new EntityNotFoundException("Admin not found"));

        // Cập nhật status
        request.setStatus(RequestStatus.REJECTED);
        request.setRejectReason(reason);
        request.setReviewedBy(admin);
        request.setReviewedAt(LocalDateTime.now());

        SellerRequest updatedRequest = sellerRequestRepository.save(request);
        return toResponse(updatedRequest);
    }

    @Override
    @Transactional(readOnly = true)
    public SellerRequestResponse getRequestById(UUID requestId) {
        SellerRequest request = sellerRequestRepository.findById(requestId)
                .orElseThrow(() -> new EntityNotFoundException("Request not found"));
        return toResponse(request);
    }

    private SellerRequestResponse toResponse(SellerRequest request) {
        return SellerRequestResponse.builder()
                .id(request.getId())
                .userId(request.getUser().getId())
                .userEmail(request.getUser().getEmail())
                .userDisplayName(request.getUser().getDisplayName())
                .citizenId(request.getCitizenId())
                .status(request.getStatus())
                .rejectReason(request.getRejectReason())
                .reviewedByName(request.getReviewedBy() != null
                        ? request.getReviewedBy().getDisplayName()
                        : null)
                .reviewedAt(request.getReviewedAt())
                .createdAt(request.getCreatedAt())
                .updatedAt(request.getUpdatedAt())
                .build();
    }
}

