package com.mapsocial.service;

import com.mapsocial.dto.request.user.UpdateProfileRequest;
import com.mapsocial.dto.response.user.UserResponse;

import java.util.UUID;

public interface UserService {

    UserResponse getProfile(UUID id);
    UserResponse updateProfile(UUID id, UpdateProfileRequest updateRequest);

    // Soft delete method
    void deleteUser(UUID id);

    Long getMutualFriendsCount(UUID userId, UUID otherUserId);

}
