package com.mapsocial.service.impl;

import com.mapsocial.dto.request.user.UpdateProfileRequest;
import com.mapsocial.dto.response.user.UserResponse;
import com.mapsocial.entity.User;
import com.mapsocial.mapper.UserMapper;
import com.mapsocial.repository.FriendshipRepository;
import com.mapsocial.repository.UserRepository;
import com.mapsocial.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final FriendshipRepository friendshipRepository;

    @Override
    @Transactional(readOnly = true)
    public UserResponse getProfile(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        if (user.getDeletedAt() != null) {
            throw new RuntimeException("Tài khoản đã bị xóa");
        }

        return userMapper.toUserResponse(user);
    }

    @Override
    @Transactional
    public UserResponse updateProfile(UUID id, UpdateProfileRequest updateRequest) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        if (user.getDeletedAt() != null) {
            throw new RuntimeException("Tài khoản đã bị xóa");
        }

        // Cập nhật các thông tin có thể thay đổi
        if (updateRequest.getDisplayName() != null && !updateRequest.getDisplayName().trim().isEmpty()) {
            if (updateRequest.getDisplayName().length() > 20) {
                throw new RuntimeException("Tên hiển thị không được vượt quá 20 ký tự");
            }
            user.setDisplayName(updateRequest.getDisplayName().trim());
        }

        if (updateRequest.getAvatarUrl() != null && !updateRequest.getAvatarUrl().trim().isEmpty()) {
            user.setAvatarUrl(updateRequest.getAvatarUrl().trim());
        }

        User savedUser = userRepository.save(user);
        return userMapper.toUserResponse(savedUser);
    }

    @Override
    @Transactional
    public void deleteUser(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        if (user.getDeletedAt() != null) {
            throw new RuntimeException("Tài khoản đã bị xóa rồi");
        }

        // Soft delete
        user.setDeletedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    @Override
    public Long getMutualFriendsCount(UUID userId, UUID otherUserId) {
        if (userId.equals(otherUserId)) {
            throw new RuntimeException("Không thể đếm bạn chung với chính mình");
        }

        return friendshipRepository.countMutualFriends(userId, otherUserId);
    }


}
