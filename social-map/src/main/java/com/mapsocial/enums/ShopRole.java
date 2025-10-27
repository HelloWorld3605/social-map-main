package com.mapsocial.enums;

/**
 * Vai trò quản lý trong phạm vi 1 shop (shop-level role)
 */
public enum ShopRole {
    OWNER,   // chủ shop (có toàn quyền CRUD menu, order, nhân viên)
    MANAGER, // quản lý (có quyền gần như chủ, nhưng không thể xóa chủ)
    STAFF,   // nhân viên (xem order, phục vụ khách)
    CASHIER  // thu ngân (xử lý thanh toán)
}
