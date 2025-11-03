package com.mapsocial.dto.request.admin;

import com.mapsocial.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateUserRequest {

    @Email(message = "Email không hợp lệ")
    private String email;

    @Size(min = 2, max = 100, message = "Tên hiển thị phải từ 2-100 ký tự")
    private String displayName;

    private UserRole role;

    private Boolean emailVerified;
}

