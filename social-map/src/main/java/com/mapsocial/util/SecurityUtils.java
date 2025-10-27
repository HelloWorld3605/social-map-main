package com.mapsocial.util;

import com.mapsocial.entity.User;
import com.mapsocial.service.impl.CustomUserDetailsService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

public class SecurityUtils {

    /**
     * Lấy thông tin user hiện tại từ SecurityContext
     */
    public static User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetailsService.UserPrincipal) {
            CustomUserDetailsService.UserPrincipal userPrincipal =
                    (CustomUserDetailsService.UserPrincipal) authentication.getPrincipal();
            return userPrincipal.getUser();
        }

        return null;
    }

    /**
     * Lấy email của user hiện tại
     */
    public static String getCurrentUserEmail() {
        User user = getCurrentUser();
        return user != null ? user.getEmail() : null;
    }

    /**
     * Lấy ID của user hiện tại
     */
    public static UUID getCurrentUserId() {
        User user = getCurrentUser();
        return user != null ? user.getId() : null;
    }

    /**
     * Kiểm tra user có đang đăng nhập không
     */
    public static boolean isAuthenticated() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.isAuthenticated() &&
               !(authentication.getPrincipal() instanceof String);
    }

    /**
     * Kiểm tra user hiện tại có role cụ thể không
     */
    public static boolean hasRole(String role) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null) {
            return authentication.getAuthorities().stream()
                    .anyMatch(grantedAuthority -> grantedAuthority.getAuthority().equals("ROLE_" + role));
        }
        return false;
    }

    /**
     * Kiểm tra user hiện tại có phải là admin không
     */
    public static boolean isAdmin() {
        return hasRole("ADMIN");
    }

    /**
     * Kiểm tra user hiện tại có phải là owner của resource không
     */
    public static boolean isOwner(UUID resourceUserId) {
        UUID currentUserId = getCurrentUserId();
        return currentUserId != null && currentUserId.equals(resourceUserId);
    }
}
