package com.mapsocial.service;

import com.mapsocial.entity.Shop;
import com.mapsocial.enums.ShopStatus;
import com.mapsocial.repository.ShopRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ShopStatusService {

    private final StringRedisTemplate redisTemplate;
    private final ShopRepository shopRepository;
    private final SimpMessagingTemplate messagingTemplate;

    private static final String SHOP_STATUS_KEY_PREFIX = "shop:status:";
    private static final Duration STATUS_TTL = Duration.ofMinutes(5); // TTL ngắn để đảm bảo cập nhật thường xuyên
    private static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    /**
     * Tính toán trạng thái hoạt động của shop dựa trên giờ mở/đóng cửa
     * @param shop Shop entity
     * @return ShopStatus tính toán được
     */
    public ShopStatus calculateShopStatus(Shop shop) {
        // Nếu shop bị ban, luôn trả về BANNED
        if (shop.getStatus() == ShopStatus.BANNED) {
            return ShopStatus.BANNED;
        }

        // Nếu không có giờ mở/đóng cửa, sử dụng status mặc định từ DB
        if (shop.getOpeningTime() == null || shop.getClosingTime() == null) {
            return shop.getStatus();
        }

        LocalTime now = LocalTime.now(VIETNAM_ZONE);
        LocalTime openTime = shop.getOpeningTime();
        LocalTime closeTime = shop.getClosingTime();

        boolean isOpen;

        // Xử lý trường hợp đóng cửa qua đêm (ví dụ: 18:00 - 02:00)
        if (closeTime.isBefore(openTime)) {
            // Shop mở qua đêm
            isOpen = now.isAfter(openTime) || now.isBefore(closeTime);
        } else {
            // Shop mở trong ngày bình thường
            isOpen = !now.isBefore(openTime) && now.isBefore(closeTime);
        }

        if (isOpen) {
            // Nếu đang mở, giữ trạng thái chi tiết (OPEN, BUSY, FULL, QUIET) từ DB
            ShopStatus currentStatus = shop.getStatus();
            if (currentStatus == ShopStatus.OPEN ||
                currentStatus == ShopStatus.BUSY ||
                currentStatus == ShopStatus.FULL ||
                currentStatus == ShopStatus.QUIET) {
                return currentStatus;
            }
            return ShopStatus.OPEN;
        } else {
            return ShopStatus.CLOSED;
        }
    }

    /**
     * Lấy trạng thái shop từ Redis, nếu không có thì tính toán và cache
     */
    public ShopStatus getShopStatus(UUID shopId) {
        String key = SHOP_STATUS_KEY_PREFIX + shopId.toString();
        String cachedStatus = redisTemplate.opsForValue().get(key);

        if (cachedStatus != null) {
            try {
                return ShopStatus.valueOf(cachedStatus);
            } catch (IllegalArgumentException e) {
                log.warn("Invalid shop status in Redis: {}", cachedStatus);
            }
        }

        // Cache miss - tính toán và lưu vào Redis
        Optional<Shop> shopOpt = shopRepository.findById(shopId);
        if (shopOpt.isPresent()) {
            ShopStatus status = calculateShopStatus(shopOpt.get());
            cacheShopStatus(shopId, status);
            return status;
        }

        return ShopStatus.CLOSED; // Default
    }

    /**
     * Lấy trạng thái cho nhiều shops cùng lúc (batch)
     */
    public Map<UUID, ShopStatus> getShopStatuses(List<UUID> shopIds) {
        Map<UUID, ShopStatus> result = new HashMap<>();
        List<UUID> missingIds = new ArrayList<>();

        // Batch get từ Redis
        List<String> keys = shopIds.stream()
                .map(id -> SHOP_STATUS_KEY_PREFIX + id.toString())
                .toList();

        List<String> cachedStatuses = redisTemplate.opsForValue().multiGet(keys);

        for (int i = 0; i < shopIds.size(); i++) {
            UUID shopId = shopIds.get(i);
            String cachedStatus = cachedStatuses != null ? cachedStatuses.get(i) : null;

            if (cachedStatus != null) {
                try {
                    result.put(shopId, ShopStatus.valueOf(cachedStatus));
                } catch (IllegalArgumentException e) {
                    missingIds.add(shopId);
                }
            } else {
                missingIds.add(shopId);
            }
        }

        // Xử lý các shop không có trong cache
        if (!missingIds.isEmpty()) {
            List<Shop> shops = shopRepository.findAllById(missingIds);
            for (Shop shop : shops) {
                ShopStatus status = calculateShopStatus(shop);
                result.put(shop.getId(), status);
                cacheShopStatus(shop.getId(), status);
            }
        }

        return result;
    }

    /**
     * Cache trạng thái shop vào Redis
     */
    public void cacheShopStatus(UUID shopId, ShopStatus status) {
        String key = SHOP_STATUS_KEY_PREFIX + shopId.toString();
        redisTemplate.opsForValue().set(key, status.toString(), STATUS_TTL);
    }

    /**
     * Cập nhật trạng thái shop thủ công (cho owner/manager)
     * Chỉ cho phép cập nhật các trạng thái chi tiết khi shop đang mở
     */
    public void updateShopStatus(UUID shopId, ShopStatus newStatus) {
        Optional<Shop> shopOpt = shopRepository.findById(shopId);
        if (shopOpt.isEmpty()) {
            return;
        }

        Shop shop = shopOpt.get();
        ShopStatus calculatedStatus = calculateShopStatus(shop);

        // Chỉ cho phép cập nhật chi tiết nếu shop đang mở
        if (calculatedStatus != ShopStatus.CLOSED && calculatedStatus != ShopStatus.BANNED) {
            cacheShopStatus(shopId, newStatus);

            // Broadcast qua WebSocket
            broadcastStatusChange(shopId, newStatus);
        }
    }

    /**
     * Xóa cache trạng thái của một shop
     */
    public void invalidateShopStatus(UUID shopId) {
        String key = SHOP_STATUS_KEY_PREFIX + shopId.toString();
        redisTemplate.delete(key);
    }

    /**
     * Scheduled job: Cập nhật trạng thái tất cả shops mỗi phút
     * Chạy vào đầu mỗi phút để đảm bảo trạng thái được cập nhật kịp thời
     */
    @Scheduled(cron = "0 * * * * *") // Mỗi phút
    public void updateAllShopStatuses() {
        log.info("Starting scheduled shop status update...");

        List<Shop> allShops = shopRepository.findAll();
        int updatedCount = 0;

        for (Shop shop : allShops) {
            // Bỏ qua shop bị ban
            if (shop.getStatus() == ShopStatus.BANNED) {
                cacheShopStatus(shop.getId(), ShopStatus.BANNED);
                continue;
            }

            ShopStatus newStatus = calculateShopStatus(shop);
            String key = SHOP_STATUS_KEY_PREFIX + shop.getId().toString();
            String oldStatusStr = redisTemplate.opsForValue().get(key);

            // Chỉ broadcast nếu trạng thái thay đổi
            if (oldStatusStr == null || !oldStatusStr.equals(newStatus.toString())) {
                cacheShopStatus(shop.getId(), newStatus);
                broadcastStatusChange(shop.getId(), newStatus);
                updatedCount++;
            } else {
                // Refresh TTL
                redisTemplate.expire(key, STATUS_TTL);
            }
        }

        log.info("Completed shop status update. Updated {} shops out of {}", updatedCount, allShops.size());
    }

    /**
     * Broadcast thay đổi trạng thái qua WebSocket
     */
    private void broadcastStatusChange(UUID shopId, ShopStatus status) {
        try {
            messagingTemplate.convertAndSend("/topic/shop-status", Map.of(
                    "shopId", shopId.toString(),
                    "status", status.toString()
            ));
        } catch (Exception e) {
            log.warn("Failed to broadcast shop status change: {}", e.getMessage());
        }
    }

    /**
     * Khởi tạo cache cho tất cả shops khi ứng dụng khởi động
     */
    public void initializeShopStatusCache() {
        log.info("Initializing shop status cache...");
        List<Shop> allShops = shopRepository.findAll();

        for (Shop shop : allShops) {
            ShopStatus status = calculateShopStatus(shop);
            cacheShopStatus(shop.getId(), status);
        }

        log.info("Initialized status cache for {} shops", allShops.size());
    }
}

