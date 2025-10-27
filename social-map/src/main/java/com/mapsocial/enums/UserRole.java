package com.mapsocial.enums;


/**
 * Quyền cấp hệ thống (system-level role)
 */
public enum UserRole {
    GUEST,      // chưa đăng nhập
    USER,       // user thường (mua hàng, chat, review...)
    SELLER,     // có quyền mở shop, quản lý shop
    PREMIUM,    // user trả phí, có thêm đặc quyền (ưu đãi, giảm phí ship...)
    MODERATOR,  // kiểm duyệt nội dung (bình luận, bài viết)
    ADMIN,      // quản trị hệ thống (quản lý users, shops, reports)
    SUPER_ADMIN // chủ hệ thống, toàn quyền
}

