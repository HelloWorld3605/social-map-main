package com.mapsocial.controller;

import com.mapsocial.dto.request.shop.CreateShopRequest;
import com.mapsocial.dto.request.shop.UpdateShopRequest;
import com.mapsocial.dto.response.shop.ShopResponse;
import com.mapsocial.service.ShopService;
import com.mapsocial.service.impl.CustomUserDetailsService.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/shops")
@RequiredArgsConstructor
public class ShopController {

    private final ShopService shopService;

    @PostMapping()
    public ResponseEntity<ShopResponse> createShop(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody @Valid CreateShopRequest request) {
        UUID currentUserId = userPrincipal.getUser().getId();
        ShopResponse response = shopService.createShop(currentUserId, request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{shopId}")
    public ResponseEntity<ShopResponse> updateShop(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID shopId,
            @RequestBody @Valid UpdateShopRequest request) {
        UUID currentUserId = userPrincipal.getUser().getId();
        ShopResponse response = shopService.updateShop(currentUserId, shopId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{shopId}")
    public ResponseEntity<Void> deleteShop(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID shopId) {
        UUID currentUserId = userPrincipal.getUser().getId();
        shopService.deleteShop(currentUserId, shopId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{shopId}")
    public ResponseEntity<ShopResponse> getShopById(@PathVariable UUID shopId) {
        return ResponseEntity.ok(shopService.getShopById(shopId));
    }

    @GetMapping
    public ResponseEntity<List<ShopResponse>> getAllShops() {
        return ResponseEntity.ok(shopService.getAllShops());
    }
}
