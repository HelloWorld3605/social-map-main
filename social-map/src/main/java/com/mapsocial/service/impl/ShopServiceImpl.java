package com.mapsocial.service.impl;

import com.mapsocial.dto.request.shop.CreateShopRequest;
import com.mapsocial.dto.request.shop.UpdateShopRequest;
import com.mapsocial.dto.response.shop.ShopResponse;
import com.mapsocial.entity.*;
import com.mapsocial.enums.ShopRole;
import com.mapsocial.enums.UserRole;
import com.mapsocial.mapper.MarkerMapper;
import com.mapsocial.mapper.ShopMapper;
import com.mapsocial.repository.*;
import com.mapsocial.service.ShopService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ShopServiceImpl implements ShopService {

    private final UserRepository userRepository;
    private final ShopRepository shopRepository;
    private final TagRepository tagRepository;
    private final UserShopRepository userShopRepository;

    @Override
    @Transactional
    public ShopResponse createShop(UUID userId, CreateShopRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        if (user.getRole() != UserRole.SELLER) {
            throw new IllegalStateException("Chỉ người bán (SELLER) mới được tạo shop");
        }

        Shop shop = ShopMapper.toShop(request);

        // Gắn tag nếu có
        if (request.getTagIds() != null && !request.getTagIds().isEmpty()) {
            List<Tag> tags = tagRepository.findAllById(request.getTagIds());
            shop.setTags(tags);
        }

        // Lưu shop (sẽ tự set location trong @PrePersist)
        Shop savedShop = shopRepository.save(shop);

        // Gắn quan hệ user-shop (vai trò OWNER)
        UserShop userShop = UserShop.builder()
                .user(user)
                .shop(savedShop)
                .managerRole(ShopRole.OWNER)
                .build();

        userShopRepository.save(userShop);

        return ShopMapper.toShopResponse(savedShop);
    }

    @Override
    @Transactional
    public ShopResponse updateShop(UUID userId, UUID shopId, UpdateShopRequest request) {
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new EntityNotFoundException("Shop not found"));

        UserShop userShop = userShopRepository.findByUserIdAndShopId(userId, shopId)
                .orElseThrow(() -> new SecurityException("Bạn không quản lý shop này"));

        if (userShop.getManagerRole() != ShopRole.OWNER && userShop.getManagerRole() != ShopRole.MANAGER) {
            throw new SecurityException("Chỉ chủ shop (OWNER) hoặc quản lý (MANAGER) mới được cập nhật shop");
        }

        // Cập nhật thông tin từ request
        shop.setName(request.getName());
        shop.setAddress(request.getAddress());

        // Sử dụng MarkerMapper để set coordinates
        MarkerMapper.setCoordinates(shop, request.getLatitude(), request.getLongitude());

        shop.setDescription(request.getDescription());
        shop.setPhoneNumber(request.getPhoneNumber());
        shop.setOpeningTime(request.getOpeningTime());
        shop.setClosingTime(request.getClosingTime());

        if (request.getTagIds() != null && !request.getTagIds().isEmpty()) {
            List<Tag> tags = tagRepository.findAllById(request.getTagIds());
            shop.setTags(tags);
        }

        Shop updatedShop = shopRepository.save(shop);

        return ShopMapper.toShopResponse(updatedShop);
    }

    @Override
    @Transactional
    public void deleteShop(UUID userId, UUID shopId) {
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new EntityNotFoundException("Shop not found"));

        UserShop userShop = userShopRepository.findByUserIdAndShopId(userId, shopId)
                .orElseThrow(() -> new SecurityException("Bạn không quản lý shop này"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        if (user.getRole() == UserRole.ADMIN || user.getRole() == UserRole.SUPER_ADMIN) {
            shopRepository.delete(shop);
            return;
        }

        if (userShop.getManagerRole() != ShopRole.OWNER) {
            throw new SecurityException("Chỉ chủ shop (OWNER) mới được xóa shop");
        }

        shopRepository.delete(shop);
    }

    @Override
    @Transactional(readOnly = true)
    public ShopResponse getShopById(UUID shopId) {
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new EntityNotFoundException("Shop not found"));
        return ShopMapper.toShopResponse(shop);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ShopResponse> getAllShops() {
        return shopRepository.findAll().stream()
                .map(ShopMapper::toShopResponse)
                .toList();
    }
}
