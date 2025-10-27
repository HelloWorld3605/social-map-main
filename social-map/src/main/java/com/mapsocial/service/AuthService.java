package com.mapsocial.service;

import com.mapsocial.dto.request.*;
import com.mapsocial.dto.response.LoginResponse;
import com.mapsocial.dto.response.user.UserResponse;

import java.util.UUID;

public interface AuthService {
    String startRegistration(EmailRegistrationRequest request);
    boolean validateRegistrationToken(String token);
    UserResponse completeRegistration(CompleteRegistrationRequest request);

//    UserResponse register(RegisterRequest request);

    LoginResponse login(LoginRequest request);
    String logout(String authHeader);

    void changePassword(UUID userId, ChangePasswordRequest request);

    String verifyEmail(String token);
    void resendEmailVerification(String email);
}
