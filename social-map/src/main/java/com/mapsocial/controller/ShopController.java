package com.mapsocial.controller;

import com.mapsocial.dto.request.BoundingBoxRequest;
import com.mapsocial.dto.request.shop.CreateShopRequest;
import com.mapsocial.dto.request.shop.UpdateShopRequest;
import com.mapsocial.dto.response.ShopClusterResponse;
import com.mapsocial.dto.response.shop.ShopResponse;
import com.mapsocial.service.ShopMapService;
import com.mapsocial.service.ShopService;
import com.mapsocial.service.impl.CustomUserDetailsService.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Shops", description = "API quản lý shops và hiển thị trên bản đồ")
public class ShopController {

    private final ShopService shopService;
    private final ShopMapService shopMapService;

    // ==================== MAP VIEW APIs ====================

    @GetMapping("/map")
    @Operation(summary = "Lấy shops/clusters trong vùng bản đồ (Bounding Box)",
               description = "Tự động quyết định trả về clusters hoặc individual shops dựa vào zoom level và số lượng")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Thành công"),
            @ApiResponse(responseCode = "400", description = "Tọa độ không hợp lệ")
    })
    public ResponseEntity<List<ShopClusterResponse>> getShopsInMapView(
            @RequestParam Double north,
            @RequestParam Double south,
            @RequestParam Double east,
            @RequestParam Double west,
            @RequestParam(required = false) Integer zoom,
            @RequestParam(required = false) Integer limit) {

        BoundingBoxRequest request = BoundingBoxRequest.builder()
                .north(north)
                .south(south)
                .east(east)
                .west(west)
                .zoom(zoom)
                .limit(limit)
                .build();

        List<ShopClusterResponse> result = shopMapService.getShopsInBoundingBox(request);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/map/bounds")
    @Operation(summary = "Lấy shops/clusters trong vùng bản đồ (POST method)",
               description = "Alternative endpoint với POST body cho complex queries")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Thành công"),
            @ApiResponse(responseCode = "400", description = "Request body không hợp lệ")
    })
    public ResponseEntity<List<ShopClusterResponse>> getShopsInBounds(
            @Valid @RequestBody BoundingBoxRequest request) {
        List<ShopClusterResponse> result = shopMapService.getShopsInBoundingBox(request);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/map/individual")
    @Operation(summary = "Lấy individual shops (không cluster)",
               description = "Dùng cho zoom level cao, luôn trả về individual shops")
    public ResponseEntity<List<ShopClusterResponse>> getIndividualShops(
            @RequestParam Double north,
            @RequestParam Double south,
            @RequestParam Double east,
            @RequestParam Double west,
            @RequestParam(required = false) Integer limit) {

        BoundingBoxRequest request = BoundingBoxRequest.builder()
                .north(north)
                .south(south)
                .east(east)
                .west(west)
                .limit(limit)
                .build();

        List<ShopClusterResponse> result = shopMapService.getIndividualShopsInBoundingBox(request);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/map/clusters")
    @Operation(summary = "Lấy clusters (luôn cluster)",
               description = "Dùng cho zoom level thấp, luôn trả về clusters")
    public ResponseEntity<List<ShopClusterResponse>> getClusters(
            @RequestParam Double north,
            @RequestParam Double south,
            @RequestParam Double east,
            @RequestParam Double west) {

        BoundingBoxRequest request = BoundingBoxRequest.builder()
                .north(north)
                .south(south)
                .east(east)
                .west(west)
                .build();

        List<ShopClusterResponse> result = shopMapService.getClustersInBoundingBox(request);
        return ResponseEntity.ok(result);
    }

    // ==================== CRUD APIs ====================

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
