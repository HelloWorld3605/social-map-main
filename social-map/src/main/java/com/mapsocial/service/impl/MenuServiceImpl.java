package com.mapsocial.service.impl;

import com.mapsocial.dto.request.menu.CreateMenuRequest;
import com.mapsocial.dto.response.menu.MenuResponse;
import com.mapsocial.dto.request.menu.UpdateMenuRequest;
import com.mapsocial.entity.Menu;
import com.mapsocial.entity.Shop;
import com.mapsocial.entity.User;
import com.mapsocial.entity.UserShop;
import com.mapsocial.enums.ShopRole;
import com.mapsocial.mapper.MenuMapper;
import com.mapsocial.repository.MenuRepository;
import com.mapsocial.repository.ShopRepository;
import com.mapsocial.repository.UserRepository;
import com.mapsocial.repository.UserShopRepository;
import com.mapsocial.service.MenuService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MenuServiceImpl implements MenuService {

    private final MenuRepository menuRepository;
    private final ShopRepository shopRepository;
    private final UserRepository userRepository;
    private final UserShopRepository userShopRepository;

    @Override
    @Transactional
    public MenuResponse createMenu(CreateMenuRequest request, UUID sellerId) {
        Shop shop = shopRepository.findById(request.getShopId())
                .orElseThrow(() -> new EntityNotFoundException("Shop không tồn tại"));

        UserShop userShop = userShopRepository.findByUserIdAndShopId(sellerId, shop.getId())
                .orElseThrow(() -> new SecurityException("Bạn không quản lý shop này"));

        if (userShop.getManagerRole() == ShopRole.STAFF || userShop.getManagerRole() == ShopRole.CASHIER) {
            throw new SecurityException("Nhân viên (STAFF) và thu ngân (CASHIER) không có quyền tạo menu");
        }

        Menu menu = MenuMapper.toEntity(request, shop);
        return MenuMapper.toResponse(menuRepository.save(menu));
    }

    @Override
    @Transactional
    public MenuResponse updateMenu(UUID menuId, UpdateMenuRequest request, UUID sellerId) {
        Menu menu = menuRepository.findById(menuId)
                .orElseThrow(() -> new EntityNotFoundException("Menu không tồn tại"));

        UserShop userShop = userShopRepository.findByUserIdAndShopId(sellerId, menu.getShop().getId())
                .orElseThrow(() -> new SecurityException("Bạn không quản lý shop này"));

        if (userShop.getManagerRole() == ShopRole.STAFF || userShop.getManagerRole() == ShopRole.CASHIER) {
            throw new SecurityException("Nhân viên (STAFF) và thu ngân (CASHIER) không có quyền sửa menu");
        }

        menu.setName(request.getName());
        return MenuMapper.toResponse(menuRepository.save(menu));
    }

    @Override
    @Transactional
    public void deleteMenu(UUID menuId, UUID sellerId) {
        Menu menu = menuRepository.findById(menuId)
                .orElseThrow(() -> new EntityNotFoundException("Menu không tồn tại"));

        UserShop userShop = userShopRepository.findByUserIdAndShopId(sellerId, menu.getShop().getId())
                .orElseThrow(() -> new SecurityException("Bạn không quản lý shop này"));

        if (userShop.getManagerRole() != ShopRole.OWNER) {
            throw new SecurityException("Chỉ chủ shop (OWNER) mới có quyền xóa menu");
        }

        menuRepository.delete(menu);
    }

    @Override
    @Transactional(readOnly = true)
    public MenuResponse getMenuById(UUID menuId) {
        Menu menu = menuRepository.findById(menuId)
                .orElseThrow(() -> new EntityNotFoundException("Menu không tồn tại"));
        return MenuMapper.toResponse(menu);
    }
}
