package com.mapsocial.mapper;

import com.mapsocial.dto.response.user.UserResponse;
import com.mapsocial.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserResponse toUserResponse(User user) {
        if (user == null) {
            return null;
        }

        return UserResponse.builder()
                .id(user.getId().toString())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .role(user.getRole())
                .avatarUrl(user.getAvatarUrl())
                .coverPhoto(user.getCoverPhoto())
                .citizenId(user.getCitizenId())
                .isEmailVerified(user.getIsEmailVerified())
                .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null)
                .build();
    }
}
